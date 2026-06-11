import { supabase } from '@/lib/supabase'

const getNumber = (value: any, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const normalizeProduct = (product: any) => {
  const vendor = product?.vendor || {}
  const quantity = product?.stock_quantity ?? product?.quantity_in_stock ?? 0
  const rating = product?.rating ?? product?.average_rating ?? 0

  return {
    ...product,
    image: product?.image || product?.image_url || '/placeholder.jpg',
    image_url: product?.image_url || product?.image || '/placeholder.jpg',
    stock_quantity: getNumber(quantity),
    quantity_in_stock: getNumber(quantity),
    rating: getNumber(rating),
    average_rating: getNumber(rating),
    category: product?.category || product?.category_name || product?.category_id || 'General',
    vendor: {
      ...vendor,
      name: vendor?.name || vendor?.company_name || vendor?.business_name || 'Verified vendor',
      business_name: vendor?.business_name || vendor?.company_name || vendor?.name || 'Verified vendor',
    },
  }
}

export const getProducts = async (filters?: any) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, vendor:vendors(*), reviews(*)')

  if (error) {
    console.error('Failed to fetch products:', error.message)
    return []
  }

  let products = (data || []).map(normalizeProduct)

  if (filters?.search) {
    const search = filters.search.toLowerCase()
    products = products.filter((product) =>
      [product.name, product.description, product.category, product.vendor?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    )
  }

  if (filters?.category) {
    products = products.filter((product) => product.category === filters.category)
  }

  if (filters?.priceRange) {
    const [min, max] = filters.priceRange
    products = products.filter((product) => product.price >= min && product.price <= max)
  }

  if (filters?.inStock) {
    products = products.filter((product) => product.stock_quantity > 0)
  }

  if (filters?.sortBy === 'price_low') {
    products.sort((a, b) => a.price - b.price)
  } else if (filters?.sortBy === 'price_high') {
    products.sort((a, b) => b.price - a.price)
  } else if (filters?.sortBy === 'rating') {
    products.sort((a, b) => b.rating - a.rating)
  } else {
    products.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  }

  return products.slice(0, 50)
}

export const getProduct = async (id: string) => {
  const { data } = await supabase
    .from('products')
    .select('*, vendor:vendors(*), reviews(*)')
    .eq('id', id)
    .single()
  return data ? normalizeProduct(data) : null
}

export const searchProducts = async (query: string) => {
  const { data } = await supabase
    .from('products')
    .select('id, name, image, image_url, price, rating, average_rating')
    .ilike('name', `%${query}%`)
    .limit(10)
  return (data || []).map(normalizeProduct)
}

export const getRecommendedProducts = async (userId: string) => {
  const { data } = await supabase
    .from('products')
    .select('*')
    .limit(6)
  return (data || []).map(normalizeProduct).sort((a, b) => b.rating - a.rating)
}
