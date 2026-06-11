'use client'

import { useState, useEffect } from 'react'
import { getRecommendedProducts } from '@/lib/api/products'
import ProductCard from './product-card'
import Link from 'next/link'

export default function FeaturedProducts() {
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      const data = await getRecommendedProducts('user-id')
      setProducts(data || [])
    }
    fetchProducts()
  }, [])

  return (
    <section className="py-16 bg-transparent">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Featured Products
            </h2>
            <p className="text-gray-600">
              Top-rated products from verified vendors
            </p>
          </div>
          <Link
            href="/products"
            className="text-green-600 font-semibold hover:text-green-700"
          >
            View All →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(0, 8).map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
