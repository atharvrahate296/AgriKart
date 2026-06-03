'use client'

import { FiStar, FiShoppingCart, FiHeart, FiShare2 } from 'react-icons/fi'
import { useState } from 'react'
import { useCart } from '@/lib/store/cartStore'

export default function ProductDetails({ product }: any) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
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

  const images = [product.image, ...((product.additional_images as string[]) || [])]
  const inStock = product.stock_quantity > 0

  return (
    <div className="space-y-8">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="bg-gray-100 rounded-lg overflow-hidden h-96 flex items-center justify-center">
          <img
            src={images[selectedImage]}
            alt={product.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img: string, i: number) => (
            <button
              key={i}
              onClick={() => setSelectedImage(i)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                selectedImage === i ? 'border-green-600' : 'border-gray-200'
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-4">
        <div>
          <p className="text-gray-500 text-sm">{product.category}</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                size={18}
                fill={i < Math.floor(product.rating || 4.5) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {product.rating || 4.5}/5 ({product.reviews?.length || 0} reviews)
          </span>
        </div>

        {/* Price */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold text-green-600">₹{product.price}</p>
            {product.original_price && (
              <>
                <p className="text-xl text-gray-500 line-through">₹{product.original_price}</p>
                <p className="text-lg font-semibold text-red-600">
                  {Math.round(((product.original_price - product.price) / product.original_price) * 100)}% off
                </p>
              </>
            )}
          </div>
          <p className="text-sm text-gray-600">Inclusive of all taxes</p>
        </div>

        {/* Description */}
        <div>
          <h3 className="font-bold text-gray-900 mb-2">Description</h3>
          <p className="text-gray-700 leading-relaxed">{product.description}</p>
        </div>

        {/* Stock & Availability */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className={`font-semibold ${inStock ? 'text-green-600' : 'text-red-600'}`}>
            {inStock ? `✓ ${product.stock_quantity} items in stock` : '✗ Out of Stock'}
          </p>
        </div>

        {/* Quantity & Actions */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="flex-1 py-2 hover:bg-gray-100"
            >
              −
            </button>
            <span className="flex-1 text-center font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="flex-1 py-2 hover:bg-gray-100"
            >
              +
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`col-span-2 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
              isAdded
                ? 'bg-green-600 text-white'
                : inStock
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <FiShoppingCart size={20} />
            {isAdded ? 'Added to Cart!' : 'Add to Cart'}
          </button>
        </div>

        {/* Additional Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button className="py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
            <FiHeart size={20} />
            Wishlist
          </button>
          <button className="py-3 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2">
            <FiShare2 size={20} />
            Share
          </button>
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Specifications</h3>
        <div className="space-y-3">
          {product.specifications &&
            Object.entries(product.specifications).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-700">{key}</span>
                <span className="font-semibold text-gray-900">{value as string}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Reviews</h3>
        <div className="space-y-4">
          {product.reviews?.slice(0, 3).map((review: any) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-gray-900">{review.user_name}</p>
                <div className="flex text-yellow-400">
                  {[...Array(review.rating)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
              </div>
              <p className="text-gray-700">{review.comment}</p>
              <p className="text-xs text-gray-500 mt-2">{review.created_at}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
