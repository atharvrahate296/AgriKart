'use client'

import Link from 'next/link'
import { FiArrowRight } from 'react-icons/fi'

export default function CallToAction() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-2xl p-12 md:p-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Are you a Vendor or Wholesaler?
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Reach thousands of farmers across the country. Join AgriKart and expand your business instantly.
            </p>
            <Link
              href="/auth/signup?type=vendor"
              className="inline-flex items-center gap-2 bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-50 transition transform hover:scale-105"
            >
              Become a Vendor <FiArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
