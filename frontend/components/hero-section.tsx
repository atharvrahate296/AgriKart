'use client'

import Link from 'next/link'
import { FiArrowRight, FiTruck, FiShield, FiHeadphones } from 'react-icons/fi'

export default function HeroSection() {
  return (
    <div className="relative bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white pt-8 pb-10 md:pt-12 md:pb-14 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div>
              <p className="text-green-100 text-lg font-semibold mb-2">Welcome to AgriKart</p>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Empowering Farmers with Quality Products
              </h1>
            </div>

            <p className="text-xl text-green-50 leading-relaxed">
              Direct connection between farmers and verified vendors. Access premium agricultural products, competitive prices, and expert guidance all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition transform hover:scale-105"
              >
                Explore Products <FiArrowRight size={20} />
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white/10 transition"
              >
                Get Started
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div>
                <p className="text-3xl font-bold">50K+</p>
                <p className="text-green-100 text-sm">Products</p>
              </div>
              <div>
                <p className="text-3xl font-bold">10K+</p>
                <p className="text-green-100 text-sm">Vendors</p>
              </div>
              <div>
                <p className="text-3xl font-bold">100K+</p>
                <p className="text-green-100 text-sm">Farmers</p>
              </div>
            </div>
          </div>

          {/* Right Side - Features */}
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition">
              <div className="flex gap-4 items-start">
                <FiTruck className="text-2xl flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-1">Fast Delivery</h3>
                  <p className="text-green-100 text-sm">Get products delivered to your doorstep in 2-5 business days</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition">
              <div className="flex gap-4 items-start">
                <FiShield className="text-2xl flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-1">Verified Sellers</h3>
                  <p className="text-green-100 text-sm">All vendors are KYC verified and trusted partners</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:bg-white/20 transition">
              <div className="flex gap-4 items-start">
                <FiHeadphones className="text-2xl flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-lg mb-1">24/7 Support</h3>
                  <p className="text-green-100 text-sm">Direct chat with vendors for queries and bulk orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
