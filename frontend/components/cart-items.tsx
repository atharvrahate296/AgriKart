import { useCart } from '@/lib/store/cartStore'
import { useState } from 'react'
import { FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi'

export default function CartItems() {
  const { items, removeItem, updateQuantity } = useCart()

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.productId}
          className="bg-white p-4 rounded-lg shadow flex gap-4"
        >
          <img
            src={item.image}
            alt={item.productName}
            className="w-24 h-24 object-cover rounded"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{item.productName}</h3>
            <p className="text-green-600 font-bold mt-1">₹{item.price}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                updateQuantity(item.productId, Math.max(1, item.quantity - 1))
              }
              className="p-1 hover:bg-gray-100 rounded"
            >
              <FiMinus />
            </button>
            <span className="w-8 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <FiPlus />
            </button>
          </div>
          <button
            onClick={() => removeItem(item.productId)}
            className="text-red-600 hover:bg-red-50 p-2 rounded"
          >
            <FiTrash2 />
          </button>
        </div>
      ))}
    </div>
  )
}
