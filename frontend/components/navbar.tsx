'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiMenu, FiX, FiSearch, FiShoppingCart, FiUser } from 'react-icons/fi'
import { useCart } from '@/lib/store/cartStore'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { items } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const cartCount = items.length

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    router.push('/')
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold text-green-600">🌾 AgriKart</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/products" className="text-gray-700 hover:text-green-600 font-medium">
              Products
            </Link>
            {user && (
              <>
                <Link href="/disease/detect" className="text-gray-700 hover:text-green-600 font-medium">
                  Disease Detect
                </Link>
                <Link href="/assistant" className="text-gray-700 hover:text-green-600 font-medium">
                  AI Assistant
                </Link>
                <Link href="/schemes" className="text-gray-700 hover:text-green-600 font-medium">
                  Schemes
                </Link>
                <Link href="/news" className="text-gray-700 hover:text-green-600 font-medium">
                  News
                </Link>
              </>
            )}
            <Link href="/vendor" className="text-gray-700 hover:text-green-600 font-medium">
              Become a Vendor
            </Link>
            {user ? (
              <button
                onClick={handleLogout}
                className="text-gray-700 hover:text-red-600 font-medium transition"
              >
                Logout
              </button>
            ) : (
              <Link href="/auth/login" className="text-gray-700 hover:text-green-600 font-medium">
                Login
              </Link>
            )}
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
            <div className="flex items-center gap-2">
              <span className="p-2 hover:bg-gray-100 rounded-full cursor-pointer relative group">
                <FiUser size={20} />
                {user && (
                  <span className="absolute bottom-full mb-1 right-0 hidden group-hover:block bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                    {user.email}
                  </span>
                )}
              </span>
              {user && (
                <span className="text-xs font-semibold text-gray-500 max-w-[120px] truncate">
                  {user.full_name || user.email?.split('@')[0]}
                </span>
              )}
            </div>
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
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden pb-4 space-y-2 border-t border-gray-100 bg-white">
          <Link
            href="/products"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            onClick={() => setIsOpen(false)}
          >
            Products
          </Link>
          {user && (
            <>
              <Link
                href="/disease/detect"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsOpen(false)}
              >
                Disease Detect
              </Link>
              <Link
                href="/assistant"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsOpen(false)}
              >
                AI Assistant
              </Link>
              <Link
                href="/schemes"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsOpen(false)}
              >
                Schemes
              </Link>
              <Link
                href="/news"
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                onClick={() => setIsOpen(false)}
              >
                News
              </Link>
            </>
          )}
          <Link
            href="/vendor"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            onClick={() => setIsOpen(false)}
          >
            Become a Vendor
          </Link>
          {user ? (
            <button
              onClick={handleLogout}
              className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded hover:text-red-600"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              onClick={() => setIsOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
