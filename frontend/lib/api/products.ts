import { supabase } from '@/lib/supabase'

export const getProducts = async (filters?: any) => {
  let query = supabase
    .from('products')
    .select('*, vendor:vendors(*), reviews(*)', { count: 'exact' })

  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }
  if (filters?.priceRange) {
    query = query
      .gte('price', filters.priceRange[0])
      .lte('price', filters.priceRange[1])
  }
  if (filters?.inStock) {
    query = query.gt('stock_quantity', 0)
  }

  if (filters?.sortBy === 'price_low') {
    query = query.order('price', { ascending: true })
  } else if (filters?.sortBy === 'price_high') {
    query = query.order('price', { ascending: false })
  } else if (filters?.sortBy === 'rating') {
    query = query.order('rating', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query.limit(50)
  return data
}

export const getProduct = async (id: string) => {
  const { data } = await supabase
    .from('products')
    .select('*, vendor:vendors(*), reviews(*)')
    .eq('id', id)
    .single()
  return data
}

export const searchProducts = async (query: string) => {
  const { data } = await supabase
    .from('products')
    .select('id, name, image, price, rating')
    .ilike('name', `%${query}%`)
    .limit(10)
  return data
}

export const getRecommendedProducts = async (userId: string) => {
  const { data } = await supabase
    .from('products')
    .select('*')
    .order('rating', { ascending: false })
    .limit(6)
  return data
}
