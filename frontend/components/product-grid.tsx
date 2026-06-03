'use client'

import { useState, useEffect } from 'react'
import { getProducts } from '@/lib/api/products'
import ProductCard from './product-card'

export default function ProductGrid({ filters }: any) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      const data = await getProducts(filters)
      setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }, [filters])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No products found matching your criteria.</p>
        <p className="text-gray-500">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product: any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
