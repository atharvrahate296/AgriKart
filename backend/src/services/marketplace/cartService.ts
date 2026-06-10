/**
 * @fileoverview Cart Service - Shopping cart management
 * @module src/services/marketplace/cartService
 */

import { createSupabaseAdminClient } from '../../config/supabase';
import { CartItem, CartSummary, Product } from '../../types/marketplace';
import { NotFoundError, DatabaseError, ValidationError } from '../../utils/errors';
import { getProductById, getProductsByIds } from './productService';

/**
 * Get user's shopping cart
 */
export async function getCart(userId: string): Promise<CartSummary> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) {
      throw new DatabaseError(`Failed to get cart: ${error.message}`);
    }

    const cartItems = data as CartItem[];
    return calculateCartSummary(cartItems);
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to get cart: ${String(error)}`);
  }
}

/**
 * Add item to cart or update quantity if already exists
 */
export async function addToCart(
  userId: string,
  productId: string,
  quantity: number
): Promise<CartSummary> {
  try {
    // Verify product exists and has stock
    const product = await getProductById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (product.quantity_in_stock < quantity) {
      throw new ValidationError(`Only ${product.quantity_in_stock} items available`);
    }

    const supabase = createSupabaseAdminClient();

    // Check if item already in cart
    const { data: existingItem, error: checkError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItem.id);

      if (updateError) {
        throw new DatabaseError(`Failed to update cart item: ${updateError.message}`);
      }
    } else {
      // Insert new cart item
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert([
          {
            user_id: userId,
            product_id: productId,
            vendor_id: product.vendor_id,
            quantity,
          },
        ]);

      if (insertError) {
        throw new DatabaseError(`Failed to add to cart: ${insertError.message}`);
      }
    }

    // Return updated cart
    return getCart(userId);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to add to cart: ${String(error)}`);
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  userId: string,
  cartItemId: string,
  quantity: number
): Promise<CartSummary> {
  try {
    const supabase = createSupabaseAdminClient();

    // Verify ownership
    const { data: cartItem, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('id', cartItemId)
      .eq('user_id', userId)
      .single();

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    if (quantity === 0) {
      // Remove item
      return removeCartItem(userId, cartItemId);
    }

    // Verify product has enough stock
    const product = await getProductById(cartItem.product_id);
    if (product.quantity_in_stock < quantity) {
      throw new ValidationError(`Only ${product.quantity_in_stock} items available`);
    }

    // Update quantity
    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', cartItemId);

    if (updateError) {
      throw new DatabaseError(`Failed to update cart item: ${updateError.message}`);
    }

    return getCart(userId);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError || error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to update cart item: ${String(error)}`);
  }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  userId: string,
  cartItemId: string
): Promise<CartSummary> {
  try {
    const supabase = createSupabaseAdminClient();

    // Verify ownership
    const { data: cartItem } = await supabase
      .from('cart_items')
      .select('user_id')
      .eq('id', cartItemId)
      .single();

    if (!cartItem || cartItem.user_id !== userId) {
      throw new NotFoundError('Cart item not found');
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) {
      throw new DatabaseError(`Failed to remove cart item: ${error.message}`);
    }

    return getCart(userId);
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to remove cart item: ${String(error)}`);
  }
}

/**
 * Clear entire cart for user
 */
export async function clearCart(userId: string): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new DatabaseError(`Failed to clear cart: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to clear cart: ${String(error)}`);
  }
}

/**
 * Get cart summary (subtotal, tax, total)
 */
export async function getCartSummary(userId: string): Promise<CartSummary> {
  return getCart(userId);
}

/**
 * Validate cart before checkout
 * @throws ValidationError if cart is invalid
 */
export async function validateCartForCheckout(userId: string): Promise<CartSummary> {
  try {
    const cart = await getCart(userId);

    if (cart.item_count === 0) {
      throw new ValidationError('Cart is empty');
    }

    // Verify all products still have stock
    const productIds = cart.items.map(item => item.product_id);
    const products = await getProductsByIds(productIds);

    for (const item of cart.items) {
      const product = products.get(item.product_id);
      if (!product || !product.is_active) {
        throw new ValidationError(`Product ${item.product_id} is no longer available`);
      }
      if (product.quantity_in_stock < item.quantity) {
        throw new ValidationError(
          `${product.name} - only ${product.quantity_in_stock} available`
        );
      }
    }

    return cart;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to validate cart: ${String(error)}`);
  }
}

/**
 * Calculate cart summary from items
 * @internal - Helper function
 */
function calculateCartSummary(items: CartItem[]): CartSummary {
  let subtotal = 0;
  const vendorSet = new Set<string>();

  for (const item of items) {
    const itemTotal = (item.product?.price || 0) * item.quantity;
    subtotal += itemTotal;
    vendorSet.add(item.vendor_id);
  }

  // Calculate tax (18% GST - standard for India)
  const tax = Math.round(subtotal * 0.18 * 100) / 100;

  // Calculate discount (can be enhanced with coupon system)
  const discount = 0;

  // Total
  const total = subtotal + tax - discount;

  return {
    items,
    subtotal,
    tax,
    discount,
    total,
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    vendor_count: vendorSet.size,
  };
}

/**
 * Get cart item count for user
 * @internal - Used for cart icon badge
 */
export async function getCartItemCount(userId: string): Promise<number> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', userId);

    if (error) {
      return 0;
    }

    return (data as any[]).reduce((sum, item) => sum + item.quantity, 0);
  } catch {
    return 0;
  }
}
