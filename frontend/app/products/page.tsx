'use client'

import { Suspense } from 'react'
import ProductGrid from '@/components/product-grid'
import SearchAndFilters from '@/components/search-filters'
import { useState } from 'react'

export default function ProductsPage() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    priceRange: [0, 50000],
    sortBy: 'newest',
    inStock: true,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Agricultural Products</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <SearchAndFilters filters={filters} setFilters={setFilters} />
          </div>
          
          <div className="lg:col-span-3">
            <Suspense fallback={<div className="text-center py-12">Loading products...</div>}>
              <ProductGrid filters={filters} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}
