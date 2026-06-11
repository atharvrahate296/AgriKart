/**
 * @fileoverview Marketplace Routes - Product catalog, cart, checkout, reviews, vendors, and payments API
 * @module src/routes/marketplace
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createSupabaseAdminClient } from '../config/supabase';
import { authMiddleware, optionalAuthMiddleware, requireRole } from '../middleware/auth';
import { AppError, AuthorizationError, ValidationError } from '../utils/errors';

// Import services
import * as productService from '../services/marketplace/productService';
import * as categoryService from '../services/marketplace/categoryService';
import * as cartService from '../services/marketplace/cartService';
import * as orderService from '../services/marketplace/orderService';
import * as reviewService from '../services/marketplace/reviewService';
import * as vendorService from '../services/marketplace/vendorService';
import * as paymentService from '../services/marketplace/paymentService';

// Import validators
import {
  createProductSchema,
  updateProductSchema,
  productFilterSchema,
  addToCartSchema,
  updateCartItemSchema,
  createOrderSchema,
  orderStatusSchema,
  createReviewSchema,
  updateReviewSchema,
  paymentVerificationSchema,
  refundRequestSchema,
  vendorProfileUpdateSchema,
  vendorVerificationSchema,
  categoryFilterSchema,
} from '../utils/marketplace-validators';

const router = Router();

// Helper to fetch the vendor ID for the current user
async function getUserVendorId(userId: string): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (vendor) {
    return vendor.id;
  }

  const { data: legacyVendor, error: legacyError } = await supabase
    .from('vendors')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (legacyError || !legacyVendor) {
    throw new AuthorizationError('Vendor profile not found for this user');
  }

  return legacyVendor.id;
}

/* ==========================================================================
   PRODUCT ENDPOINTS
   ========================================================================== */

/**
 * GET /marketplace/products
 * List all active products with pagination, filters, and sorting
 */
router.get('/products', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedQuery = productFilterSchema.parse({
      ...req.query,
      // Map numeric query strings
      min_price: req.query.min_price ? Number(req.query.min_price) : undefined,
      max_price: req.query.max_price ? Number(req.query.max_price) : undefined,
      min_rating: req.query.min_rating ? Number(req.query.min_rating) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
      tags: req.query.tags ? (Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags]) : undefined,
    });

    const products = await productService.listProducts(parsedQuery);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/products/:id
 * Get details of a single product with vendor details
 */
router.get('/products/:id', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /marketplace/products
 * Create a new product (Vendor only)
 */
router.post('/products', authMiddleware, requireRole('vendor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const vendorId = await getUserVendorId(req.auth.userId);
    const input = createProductSchema.parse(req.body);

    const product = await productService.createProduct(vendorId, input);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /marketplace/products/:id
 * Update product (Vendor owner only)
 */
router.put('/products/:id', authMiddleware, requireRole('vendor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const vendorId = await getUserVendorId(req.auth.userId);
    const input = updateProductSchema.parse(req.body);

    const product = await productService.updateProduct(req.params.id, vendorId, input);
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /marketplace/products/:id
 * Delete product (Vendor owner only)
 */
router.delete('/products/:id', authMiddleware, requireRole('vendor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const vendorId = await getUserVendorId(req.auth.userId);

    await productService.deleteProduct(req.params.id, vendorId);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/products/vendor/:vendorId
 * Get active products belonging to a vendor (public/seller storefront)
 */
router.get('/products/vendor/:vendorId', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const products = await productService.getVendorProducts(req.params.vendorId, limit, offset);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});


/* ==========================================================================
   CATEGORY ENDPOINTS
   ========================================================================== */

/**
 * GET /marketplace/categories
 * List all categories with nested or list formats
 */
router.get('/categories', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedQuery = categoryFilterSchema.parse({
      ...req.query,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
      is_active: req.query.is_active === 'false' ? false : true,
    });

    const categories = await categoryService.listCategories(parsedQuery);
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/categories/:id/products
 * Get all products in a specific category (including subcategories by default)
 */
router.get('/categories/:id/products', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const includeSubs = req.query.include_subcategories !== 'false';

    const products = await categoryService.getCategoryProducts(req.params.id, limit, offset, includeSubs);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/categories/slug/:slug
 * Retrieve category by slug
 */
router.get('/categories/slug/:slug', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.searchByCategory(req.params.slug);
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});


/* ==========================================================================
   SHOPPING CART ENDPOINTS
   ========================================================================== */

/**
 * GET /marketplace/cart
 * Get current user's cart summary
 */
router.get('/cart', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const cart = await cartService.getCart(req.auth.userId);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /marketplace/cart
 * Add item to cart (merges quantity if already in cart)
 */
router.post('/cart', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const input = addToCartSchema.parse(req.body);

    const cart = await cartService.addToCart(req.auth.userId, input.product_id, input.quantity);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /marketplace/cart/items/:id
 * Update cart item quantity
 */
router.put('/cart/items/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const input = updateCartItemSchema.parse(req.body);

    const cart = await cartService.updateCartItem(req.auth.userId, req.params.id, input.quantity);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /marketplace/cart/items/:id
 * Remove item from cart
 */
router.delete('/cart/items/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');

    const cart = await cartService.removeCartItem(req.auth.userId, req.params.id);
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /marketplace/cart
 * Empty the shopping cart
 */
router.delete('/cart', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');

    await cartService.clearCart(req.auth.userId);
    res.status(200).json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
});


/* ==========================================================================
   ORDER ENDPOINTS
   ========================================================================== */

/**
 * POST /marketplace/orders
 * Checkout from cart, create order and create Razorpay payment order
 */
router.post('/orders', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const input = createOrderSchema.parse(req.body);

    // 1. Create Order from cart
    const order = await orderService.createOrder(req.auth.userId, input.shipping_address);

    // 2. Generate Razorpay Transaction
    const rOrder = await paymentService.createRazorpayOrder(order.id, order.total_amount);

    res.status(201).json({
      success: true,
      data: {
        order,
        razorpay: {
          order_id: rOrder.id,
          amount: rOrder.amount,
          currency: rOrder.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/orders
 * Get orders (users see their purchases, vendors see products bought from them)
 */
router.get('/orders', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    if (req.auth.role === 'vendor') {
      const vendorId = await getUserVendorId(req.auth.userId);
      const orders = await orderService.getVendorOrders(vendorId, limit, offset);
      return res.status(200).json({ success: true, data: orders });
    }

    const orders = await orderService.getOrderHistory(req.auth.userId, limit, offset);
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/orders/:id
 * Get single order with items and details
 */
router.get('/orders/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');

    const order = await orderService.getOrderWithItems(req.params.id);

    // Authorization check
    if (order.user_id !== req.auth.userId && req.auth.role !== 'admin') {
      if (req.auth.role === 'vendor') {
        const vendorId = await getUserVendorId(req.auth.userId);
        const hasVendorItem = order.items.some(item => item.vendor_id === vendorId);
        if (!hasVendorItem) {
          throw new AuthorizationError('Not authorized to view this order');
        }
      } else {
        throw new AuthorizationError('Not authorized to view this order');
      }
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /marketplace/orders/:id/status
 * Update order status (Vendor/Admin updates status)
 */
router.put('/orders/:id/status', authMiddleware, requireRole('vendor', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const input = orderStatusSchema.parse(req.body);

    const isVendor = req.auth.role === 'vendor';
    let actorId = req.auth.userId;
    if (isVendor) {
      actorId = await getUserVendorId(req.auth.userId);
    }

    const updated = await orderService.updateOrderStatus(req.params.id, input.status, actorId, isVendor);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /marketplace/orders/:id/cancel
 * Cancel order (Farmer cancels order before shipment)
 */
router.post('/orders/:id/cancel', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const reason = req.body.reason || 'Cancelled by user';

    const cancelled = await orderService.cancelOrder(req.params.id, req.auth.userId, reason);
    res.status(200).json({ success: true, data: cancelled });
  } catch (error) {
    next(error);
  }
});


/* ==========================================================================
   REVIEW ENDPOINTS
   ========================================================================== */

/**
 * GET /marketplace/reviews/product/:id
 * Get reviews list for a product
 */
router.get('/reviews/product/:id', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const reviews = await reviewService.getProductReviews(req.params.id, limit, offset);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/reviews/vendor/:id
 * Get reviews list for a vendor
 */
router.get('/reviews/vendor/:id', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const reviews = await reviewService.getVendorReviews(req.params.id, limit, offset);
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /marketplace/reviews
 * Post a new review for product or vendor
 */
router.post('/reviews', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const input = createReviewSchema.parse(req.body);

    const review = await reviewService.createReview(req.auth.userId, input);
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /marketplace/reviews/:id
 * Edit existing review (Owner only)
 */
router.put('/reviews/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const input = updateReviewSchema.parse(req.body);

    const review = await reviewService.updateReview(req.auth.userId, req.params.id, input);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /marketplace/reviews/:id
 * Delete review (Owner or Admin only)
 */
router.delete('/reviews/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');

    await reviewService.deleteReview(req.auth.userId, req.params.id);
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
});


/* ==========================================================================
   VENDOR PROFILE / ANALYTICS ENDPOINTS
   ========================================================================== */

/**
 * GET /marketplace/vendors
 * List verified and active vendors storefronts
 */
router.get('/vendors', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const vendors = await vendorService.listAllVendors(limit, offset);
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/vendors/profile/:id
 * Fetch vendor profile details
 */
router.get('/vendors/profile/:id', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vendor = await vendorService.getVendorProfile(req.params.id);
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /marketplace/vendors/profile/:id
 * Update vendor profile details (Vendor owner only)
 */
router.put('/vendors/profile/:id', authMiddleware, requireRole('vendor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const input = vendorProfileUpdateSchema.parse(req.body);

    const vendor = await vendorService.updateVendorProfile(req.params.id, req.auth.userId, input);
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/vendors/analytics/:id
 * Fetch vendor sales and operations dashboard analytics (Vendor owner or Admin only)
 */
router.get('/vendors/analytics/:id', authMiddleware, requireRole('vendor', 'admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');

    const vendor = await vendorService.getVendorProfile(req.params.id);
    if (vendor.user_id !== req.auth.userId && req.auth.role !== 'admin') {
      throw new AuthorizationError('Not authorized to view these vendor analytics');
    }

    const analytics = await vendorService.getVendorAnalytics(req.params.id);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /marketplace/vendors/:id/verify
 * Verify a vendor's documentation (Admin only)
 */
router.put('/vendors/:id/verify', authMiddleware, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = vendorVerificationSchema.parse({
      vendor_id: req.params.id,
      is_verified: req.body.is_verified,
    });

    const vendor = await vendorService.verifyVendor(input.vendor_id, input.is_verified);
    res.status(200).json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
});


/* ==========================================================================
   PAYMENT ENDPOINTS
   ========================================================================== */

/**
 * POST /marketplace/payments/verify
 * Confirm Razorpay checkout signature and update order status to completed
 */
router.post('/payments/verify', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const input = paymentVerificationSchema.parse(req.body);

    const payment = await paymentService.handlePaymentCallback(input, req.auth.userId);
    res.status(200).json({ success: true, data: payment, message: 'Payment verified and order confirmed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /marketplace/payments/history
 * Fetch transaction history logs for farmer
 */
router.get('/payments/history', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.auth) throw new AuthorizationError('Authentication required');
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const history = await paymentService.getPaymentHistory(req.auth.userId, limit, offset);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /marketplace/payments/refund
 * Request refund for cancellation (Admin or Vendor)
 */
router.post('/payments/refund', authMiddleware, requireRole('admin', 'vendor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = refundRequestSchema.parse(req.body);
    const paymentId = req.body.payment_id;
    const amount = Number(req.body.amount);

    if (!paymentId || isNaN(amount)) {
      throw new ValidationError('Transaction Payment ID and a numeric amount are required');
    }

    const refund = await paymentService.refundPayment(paymentId, amount, input.reason);
    res.status(200).json({ success: true, data: refund, message: 'Refund processed successfully' });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================================
   ERROR LOGGER FOR ROUTER
   ========================================================================== */
router.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json(error.toJSON());
    return;
  }
  
  if (error.name === 'ZodError') {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: (error as any).errors,
      },
    });
    return;
  }

  console.error('Marketplace route error:', error);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { details: error.message }),
    },
  });
});

export default router;
