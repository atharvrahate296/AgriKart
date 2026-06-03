'use client'

import Link from 'next/link'
import { FiStar, FiShoppingCart, FiHeart } from 'react-icons/fi'
import { useState } from 'react'
import { useCart } from '@/lib/store/cartStore'

export default function ProductCard({ product }: any) {
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const { addItem } = useCart()

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      productId: product.id,
      productName: product.name,
      price: product.price,
      quantity,
      image: product.image,
      vendorId: product.vendor_id,
    })
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const rating = product.rating || 4.5
  const inStock = product.stock_quantity > 0

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden cursor-pointer group">
        {/* Image */}
        <div className="relative h-48 bg-gray-200 overflow-hidden">
          <img
            src={product.image || '/placeholder.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition"
          />
          {!inStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <p className="text-white font-bold">Out of Stock</p>
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="absolute top-3 right-3 bg-white p-2 rounded-full hover:bg-gray-100 shadow"
          >
            <FiHeart size={18} className="text-red-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>

          {/* Category & Vendor */}
          <p className="text-xs text-gray-500 mb-2">
            {product.category} • {product.vendor?.name}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <FiStar
                  key={i}
                  size={14}
                  fill={i < Math.floor(rating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">({product.reviews?.length || 0})</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-lg font-bold text-green-600">₹{product.price}</p>
              {product.original_price && (
                <p className="text-xs text-gray-500 line-through">
                  ₹{product.original_price}
                </p>
              )}
            </div>
          </div>

          {/* Stock Info */}
          <p className="text-xs text-gray-600 mb-3">
            {inStock ? `${product.stock_quantity} in stock` : 'Currently unavailable'}
          </p>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleAddToCart()
            }}
            disabled={!inStock}
            className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              isAdded
                ? 'bg-green-600 text-white'
                : inStock
                ? 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <FiShoppingCart size={18} />
            {isAdded ? 'Added!' : inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </Link>
  )
}
