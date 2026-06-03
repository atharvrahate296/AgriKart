import { useCart } from '@/lib/store/cartStore'
import Link from 'next/link'

export default function CartSummary() {
  const { items, getTotalPrice } = useCart()
  const total = getTotalPrice()
  const tax = total * 0.18
  const shipping = total > 500 ? 0 : 50
  const grandTotal = total + tax + shipping

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-20">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-3 mb-4 pb-4 border-b">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-semibold">₹{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax (18%)</span>
          <span className="font-semibold">₹{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="font-semibold">
            {shipping === 0 ? 'Free' : `₹${shipping}`}
          </span>
        </div>
      </div>

      <div className="flex justify-between mb-6 text-lg font-bold">
        <span>Total</span>
        <span className="text-green-600">₹{grandTotal.toFixed(2)}</span>
      </div>

      <Link
        href="/checkout"
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition text-center block"
      >
        Proceed to Checkout
      </Link>

      <p className="text-xs text-gray-500 text-center mt-4">
        Free shipping on orders above ₹500
      </p>
    </div>
  )
}
