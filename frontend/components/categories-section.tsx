'use client'

import Link from 'next/link'

const categories = [
  { name: 'Seeds', icon: '🌱', count: 2500 },
  { name: 'Fertilizers', icon: '🧪', count: 1800 },
  { name: 'Pesticides', icon: '🦗', count: 1200 },
  { name: 'Equipment', icon: '🚜', count: 3000 },
  { name: 'Machinery', icon: '⚙️', count: 800 },
  { name: 'Tools', icon: '🔧', count: 2200 },
  { name: 'Irrigation', icon: '💧', count: 1500 },
  { name: 'Organic', icon: '🍃', count: 950 },
]

export default function CategoriesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-lg">
            Browse through our comprehensive range of agricultural products
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.name} href={`/products?category=${cat.name}`}>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 hover:shadow-lg transition transform hover:scale-105 cursor-pointer h-full">
                <div className="text-4xl mb-3">{cat.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{cat.name}</h3>
                <p className="text-sm text-gray-600">{cat.count.toLocaleString()} products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
