'use client'

import { useState, useEffect } from 'react'
import { FiSearch, FiSliders } from 'react-icons/fi'
import { searchProducts } from '@/lib/api/products'

export default function SearchAndFilters({ filters, setFilters }: any) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = async (value: string) => {
    setFilters({ ...filters, search: value })
    if (value.length > 2) {
      const results = await searchProducts(value)
      setSuggestions(results || [])
    } else {
      setSuggestions([])
    }
  }

  const categories = [
    'Seeds',
    'Fertilizers',
    'Pesticides',
    'Equipment',
    'Machinery',
    'Tools',
    'Irrigation',
    'Organic Products',
  ]

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-white rounded-lg shadow">
          <FiSearch className="ml-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            className="flex-1 px-4 py-2 outline-none rounded-lg"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        {suggestions.length > 0 && (
          <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg z-10">
            {suggestions.map((item: any) => (
              <div
                key={item.id}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              >
                {item.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 text-gray-700 font-semibold lg:hidden"
      >
        <FiSliders /> Filters
      </button>

      {(showFilters || true) && (
        <div className="space-y-6 bg-white p-6 rounded-lg shadow">
          {/* Category Filter */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Categories</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === cat}
                    onChange={() => setFilters({ ...filters, category: cat })}
                    className="rounded"
                  />
                  <span className="ml-2 text-gray-700">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Price Range</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Min: ₹{filters.priceRange[0]}</label>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  value={filters.priceRange[0]}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      priceRange: [parseInt(e.target.value), filters.priceRange[1]],
                    })
                  }
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm text-gray-600">Max: ₹{filters.priceRange[1]}</label>
                <input
                  type="range"
                  min="0"
                  max="50000"
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      priceRange: [filters.priceRange[0], parseInt(e.target.value)],
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Sort By</h3>
            <div className="space-y-2">
              {[
                { value: 'newest', label: 'Newest' },
                { value: 'price_low', label: 'Price: Low to High' },
                { value: 'price_high', label: 'Price: High to Low' },
                { value: 'rating', label: 'Top Rated' },
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="sort"
                    checked={filters.sortBy === option.value}
                    onChange={() => setFilters({ ...filters, sortBy: option.value })}
                    className="rounded"
                  />
                  <span className="ml-2 text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* In Stock Only */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.inStock}
                onChange={(e) => setFilters({ ...filters, inStock: e.target.checked })}
                className="rounded"
              />
              <span className="ml-2 text-gray-700 font-medium">In Stock Only</span>
            </label>
          </div>

          {/* Reset Button */}
          <button
            onClick={() =>
              setFilters({
                search: '',
                category: '',
                priceRange: [0, 10000],
                sortBy: 'newest',
                inStock: true,
              })
            }
            className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  )
}
