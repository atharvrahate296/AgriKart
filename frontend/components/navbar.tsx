'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiMenu, FiX, FiSearch, FiShoppingCart, FiUser } from 'react-icons/fi'
import { useCart } from '@/lib/store/cartStore'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { items } = useCart()
  const cartCount = items.length

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold text-green-600">🌾 AgriKart</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-green-600 font-medium">
              Products
            </Link>
            <Link href="/vendor" className="text-gray-700 hover:text-green-600 font-medium">
              Become a Vendor
            </Link>
            <Link href="/auth/login" className="text-gray-700 hover:text-green-600 font-medium">
              Login
            </Link>
          </div>

          {/* Right Side Icons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <FiSearch size={20} />
            </button>
            <Link href="/cart" className="relative p-2 hover:bg-gray-100 rounded-full">
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <FiUser size={20} />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link href="/cart" className="relative p-2">
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link
              href="/products"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Products
            </Link>
            <Link
              href="/vendor"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Become a Vendor
            </Link>
            <Link
              href="/auth/login"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Login
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
