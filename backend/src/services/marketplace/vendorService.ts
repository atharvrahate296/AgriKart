/**
 * @fileoverview Vendor Service - Vendor profile and analytics management
 * @module src/services/marketplace/vendorService
 */

import { createSupabaseAdminClient } from '../../config/supabase';
import { Vendor, VendorAnalytics, RatingStats } from '../../types/marketplace';
import { NotFoundError, DatabaseError, AuthorizationError, ValidationError } from '../../utils/errors';
import { VendorProfileUpdateInput } from '../../utils/marketplace-validators';

/**
 * Get vendor profile
 */
export async function getVendorProfile(vendorId: string): Promise<Vendor> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (error || !data) {
      throw new NotFoundError('Vendor not found');
    }

    return data as Vendor;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError(`Failed to get vendor profile: ${String(error)}`);
  }
}

/**
 * Update vendor profile (owner only)
 */
export async function updateVendorProfile(
  vendorId: string,
  userId: string,
  input: VendorProfileUpdateInput
): Promise<Vendor> {
  try {
    // Verify ownership
    const vendor = await getVendorProfile(vendorId);
    if (vendor.user_id !== userId) {
      throw new AuthorizationError('Not authorized to update this vendor profile');
    }

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('vendors')
      .update({
        ...(input.business_name && { business_name: input.business_name }),
        ...(input.business_description && { business_description: input.business_description }),
        ...(input.avatar_url && { avatar_url: input.avatar_url }),
        ...(input.banner_url && { banner_url: input.banner_url }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId)
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseError(`Failed to update vendor profile: ${error?.message}`);
    }

    return data as Vendor;
  } catch (error) {
    if (error instanceof AuthorizationError || error instanceof NotFoundError || error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to update vendor profile: ${String(error)}`);
  }
}

/**
 * Get vendor analytics (sales, ratings, etc.)
 */
export async function getVendorAnalytics(vendorId: string): Promise<VendorAnalytics> {
  try {
    const supabase = createSupabaseAdminClient();

    // Get total sales from orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('order_items')
      .select('subtotal, order_id, product_id')
      .eq('vendor_id', vendorId)
      .eq('orders.status', 'delivered'); // Only count delivered orders

    if (ordersError) {
      throw new DatabaseError(`Failed to get sales data: ${ordersError.message}`);
    }

    const totalSales = (ordersData as any[]).reduce((sum, item) => sum + item.subtotal, 0);

    // Get vendor info and ratings
    const vendor = await getVendorProfile(vendorId);

    // Get top products
    const { data: topProductsData } = await supabase
      .from('order_items')
      .select('product_id, quantity, subtotal')
      .eq('vendor_id', vendorId)
      .order('subtotal', { ascending: false })
      .limit(5);

    // Get recent orders
    const { data: recentOrdersData } = await supabase
      .from('order_items')
      .select('order_id')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get rating distribution
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('vendor_id', vendorId);

    const reviews = (reviewsData as any[]) || [];
    const ratingDistribution = {
      five_star: reviews.filter(r => r.rating === 5).length,
      four_star: reviews.filter(r => r.rating === 4).length,
      three_star: reviews.filter(r => r.rating === 3).length,
      two_star: reviews.filter(r => r.rating === 2).length,
      one_star: reviews.filter(r => r.rating === 1).length,
    };

    // Calculate sales trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: trendData } = await supabase
      .from('order_items')
      .select('created_at, subtotal')
      .eq('vendor_id', vendorId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const salesTrend = groupSalesByDate(trendData as any[]);

    return {
      vendor_id: vendorId,
      total_sales: totalSales,
      total_revenue: totalSales, // After commission
      total_orders: ordersData?.length || 0,
      average_rating: vendor.average_rating,
      total_reviews: vendor.total_reviews,
      total_products: await getVendorProductCount(vendorId),
      active_products: await getActiveProductCount(vendorId),
      average_order_value: ordersData && ordersData.length > 0 ? totalSales / ordersData.length : 0,
      repeat_customer_count: await getRepeatCustomerCount(vendorId),
      top_products: [], // Simplified for now
      recent_orders: [], // Simplified for now
      sales_trend: salesTrend,
      rating_distribution: ratingDistribution,
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to get vendor analytics: ${String(error)}`);
  }
}

/**
 * Get vendor reviews
 */
export async function getVendorReviews(
  vendorId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error, count } = await supabase
      .from('reviews')
      .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `, { count: 'exact' })
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new DatabaseError(`Failed to get vendor reviews: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      limit,
      offset,
      has_more: offset + limit < (count || 0),
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to get vendor reviews: ${String(error)}`);
  }
}

/**
 * List all vendors (with pagination)
 */
export async function listAllVendors(limit: number = 50, offset: number = 0) {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error, count } = await supabase
      .from('vendors')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .eq('is_verified', true)
      .order('average_rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new DatabaseError(`Failed to list vendors: ${error.message}`);
    }

    return {
      data: data as Vendor[],
      total: count || 0,
      limit,
      offset,
      has_more: offset + limit < (count || 0),
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to list vendors: ${String(error)}`);
  }
}

/**
 * Verify vendor (admin only)
 */
export async function verifyVendor(vendorId: string, isVerified: boolean): Promise<Vendor> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('vendors')
      .update({
        is_verified: isVerified,
        verification_date: isVerified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendorId)
      .select()
      .single();

    if (error || !data) {
      throw new DatabaseError(`Failed to verify vendor: ${error?.message}`);
    }

    return data as Vendor;
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to verify vendor: ${String(error)}`);
  }
}

/**
 * Get vendor product count
 * @internal
 */
async function getVendorProductCount(vendorId: string): Promise<number> {
  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Get active product count
 * @internal
 */
async function getActiveProductCount(vendorId: string): Promise<number> {
  try {
    const supabase = createSupabaseAdminClient();
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('is_active', true);

    return count || 0;
  } catch {
    return 0;
  }
}

/**
 * Get repeat customer count
 * @internal
 */
async function getRepeatCustomerCount(vendorId: string): Promise<number> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('orders')
      .select('user_id')
      .eq('vendor_id', vendorId); // Assumes orders table has vendor_id

    if (error || !data) return 0;

    // Count unique user_ids with more than one order
    const userCounts = new Map<string, number>();
    (data as any[]).forEach(order => {
      userCounts.set(order.user_id, (userCounts.get(order.user_id) || 0) + 1);
    });

    return Array.from(userCounts.values()).filter(count => count > 1).length;
  } catch {
    return 0;
  }
}

/**
 * Group sales data by date
 * @internal
 */
function groupSalesByDate(data: any[]): Array<{ date: string; amount: number; order_count: number }> {
  const grouped = new Map<string, { amount: number; count: number }>();

  data.forEach(item => {
    const date = new Date(item.created_at).toISOString().split('T')[0];
    const existing = grouped.get(date) || { amount: 0, count: 0 };
    grouped.set(date, {
      amount: existing.amount + item.subtotal,
      count: existing.count + 1,
    });
  });

  return Array.from(grouped.entries())
    .map(([date, { amount, count }]) => ({
      date,
      amount,
      order_count: count,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
