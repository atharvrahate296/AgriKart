/**
 * @fileoverview Category Service - Product category management
 * @module src/services/marketplace/categoryService
 */

import { createSupabaseAdminClient } from '../../config/supabase';
import { Category, Product, PaginatedResponse } from '../../types/marketplace';
import { DatabaseError, NotFoundError } from '../../utils/errors';
import { CategoryFilterInput } from '../../utils/marketplace-validators';

/**
 * List all categories with filtering and pagination
 */
export async function listCategories(
  filter: CategoryFilterInput
): Promise<PaginatedResponse<Category>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { limit = 50, offset = 0, parent_category_id, is_active } = filter;

    let query = supabase
      .from('categories')
      .select('*', { count: 'exact' });

    if (parent_category_id !== undefined) {
      if (parent_category_id === null) {
        query = query.is('parent_category_id', null);
      } else {
        query = query.eq('parent_category_id', parent_category_id);
      }
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active);
    } else {
      // By default, list active ones unless specified
      query = query.eq('is_active', true);
    }

    query = query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new DatabaseError(`Failed to list categories: ${error.message}`);
    }

    return {
      data: (data || []) as Category[],
      total: count || 0,
      limit,
      offset,
      has_more: offset + limit < (count || 0),
    };
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to list categories: ${String(error)}`);
  }
}

/**
 * Get category by ID
 */
export async function getCategoryById(categoryId: string): Promise<Category> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Category not found: ${categoryId}`);
    }

    return data as Category;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError(`Failed to get category: ${String(error)}`);
  }
}

/**
 * Get products under a category, optionally including subcategories
 */
export async function getCategoryProducts(
  categoryId: string,
  limit: number = 20,
  offset: number = 0,
  includeSubcategories: boolean = true
): Promise<PaginatedResponse<Product>> {
  try {
    const supabase = createSupabaseAdminClient();

    // Verify category exists
    await getCategoryById(categoryId);

    let categoryIds = [categoryId];

    if (includeSubcategories) {
      const { data: subcategories, error: subError } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_category_id', categoryId)
        .eq('is_active', true);

      if (!subError && subcategories) {
        categoryIds = [...categoryIds, ...subcategories.map(s => s.id)];
      }
    }

    const { data, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .in('category_id', categoryIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new DatabaseError(`Failed to get category products: ${error.message}`);
    }

    return {
      data: (data || []) as Product[],
      total: count || 0,
      limit,
      offset,
      has_more: offset + limit < (count || 0),
    };
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to get category products: ${String(error)}`);
  }
}

/**
 * Get subcategories of a category
 */
export async function getSubcategories(parentCategoryId: string): Promise<Category[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_category_id', parentCategoryId)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new DatabaseError(`Failed to get subcategories: ${error.message}`);
    }

    return (data || []) as Category[];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    throw new DatabaseError(`Failed to get subcategories: ${String(error)}`);
  }
}

/**
 * Search category by slug
 */
export async function searchByCategory(slug: string): Promise<Category> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new NotFoundError(`Category not found with slug: ${slug}`);
    }

    return data as Category;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError(`Failed to find category by slug: ${String(error)}`);
  }
}
