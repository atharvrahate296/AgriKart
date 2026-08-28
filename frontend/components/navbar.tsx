'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiChevronDown } from 'react-icons/fi'
import { useAuth } from '@/lib/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const router = useRouter()

  const role = user?.role

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsOpen(false)
    setDropdownOpen(false)
    router.push('/')
  }

  const getUserInitial = () => {
    if (user?.full_name) return user.full_name.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return 'U'
  }

  // Role-specific navigation
  const buyerLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/demands/create', label: 'Create Demand' },
    { href: '/demands', label: 'My Demands' },
    { href: '/logistics', label: 'Logistics' },
  ]

  const farmerLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/supply', label: 'Available Demands' },
    { href: '/quality', label: 'Quality' },
    { href: '/orders', label: 'My Orders' },
  ]

  const agentLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/quality', label: 'Quality Verification' },
    { href: '/supply', label: 'Aggregate Farmers' },
    { href: '/logistics', label: 'Logistics' },
  ]

  const adminLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/demands', label: 'All Demands' },
    { href: '/logistics', label: 'Logistics' },
    { href: '/quality', label: 'Quality' },
    { href: '/orders', label: 'All Orders' },
  ]

  const getNavLinks = () => {
    if (!user) return [{ href: '/demands', label: 'Demand Board' }]
    switch (role) {
      case 'buyer': return buyerLinks
      case 'fpo_agent': return agentLinks
      case 'admin': return adminLinks
      default: return farmerLinks // farmer is default
    }
  }

  const navLinks = getNavLinks()

  const getRoleBadge = () => {
    const labels: Record<string, string> = {
      farmer: 'Farmer/FPO',
      buyer: 'Buyer',
      fpo_agent: 'FPO Agent',
      admin: 'Admin',
      vendor: 'Buyer',
    }
    return labels[role ?? ''] ?? ''
  }

  return (
    <nav className="glass sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="text-2xl">🌾</span>
            <span className="text-xl font-extrabold text-green-700 group-hover:text-green-600 transition-colors">
              AgriKart
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link text-gray-600 hover:text-green-700 font-medium text-sm px-3 py-2 rounded-lg hover:bg-green-50/50 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              /* User Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm">
                    {getUserInitial()}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="text-sm font-medium text-gray-700 block leading-tight max-w-[100px] truncate">
                      {user.full_name || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wide">
                      {getRoleBadge()}
                    </span>
                  </div>
                  <FiChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown Menu */}
                <div className={`dropdown-menu z-50 ${dropdownOpen ? 'open' : ''}`}>
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] bg-green-50 text-green-700 font-bold px-2 py-0.5 rounded-full uppercase">
                      {getRoleBadge()}
                    </span>
                  </div>

                  <div className="py-1.5">
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      <FiUser size={16} />
                      My Profile
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      <FiSettings size={16} />
                      Dashboard
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <FiLogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Auth Buttons */
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-600 hover:text-green-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-all active:scale-[0.97] shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg text-sm font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-gray-100 pt-2 mt-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                      {getUserInitial()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.full_name || 'User'}</p>
                      <p className="text-[10px] font-bold text-green-600 uppercase">{getRoleBadge()}</p>
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <FiUser size={16} /> My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors w-full text-left"
                  >
                    <FiLogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    href="/auth/login"
                    className="block text-center px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="block text-center px-3 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-semibold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
