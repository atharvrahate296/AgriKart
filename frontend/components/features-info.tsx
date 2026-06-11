'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FiArrowRight, FiCpu, FiMessageCircle, FiTrendingUp, FiFileText, FiLock } from 'react-icons/fi'
import { useAuth } from '@/lib/hooks/useAuth'

export default function FeaturesInfo() {
  const { user } = useAuth()

  const list = [
    {
      title: '🔬 Disease Intelligence',
      description: 'Upload crop photos for instant AI-based disease diagnosis and prevention guides.',
      link: '/disease/detect',
      bgColor: 'bg-green-50 border-green-100 text-green-950',
      icon: FiCpu,
      iconColor: 'text-green-600',
    },
    {
      title: '🤖 AI Agricultural Assistant',
      description: 'Interact with our LangChain chatbot for localized crops, weather and pesticide guidance.',
      link: '/assistant',
      bgColor: 'bg-emerald-50 border-emerald-100 text-emerald-950',
      icon: FiMessageCircle,
      iconColor: 'text-emerald-600',
    },
    {
      title: '📋 Government Schemes Hub',
      description: 'Evaluate your eligibility for agricultural subsidies and apply to schemes directly.',
      link: '/schemes',
      bgColor: 'bg-blue-50 border-blue-100 text-blue-950',
      icon: FiFileText,
      iconColor: 'text-blue-600',
    },
    {
      title: '📰 Agri News & Alert Desk',
      description: 'Stay alert with real-time crop disease spread warnings and regional weather forecasts.',
      link: '/news',
      bgColor: 'bg-amber-50 border-amber-100 text-amber-950',
      icon: FiTrendingUp,
      iconColor: 'text-amber-600',
    },
  ]

  return (
    <section className="py-20 relative overflow-hidden border-t border-gray-100">
      {/* Background image covering the entire section - aligned to top to prevent cropping the farmer's head */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <Image
          src="/images/farmer_fertilizer.png"
          alt="Indian farmer with liquid fertilizer"
          fill
          sizes="100vw"
          className="object-cover object-top"
          priority
        />
      </div>

      {/* Premium semi-transparent overlay to ensure text contrast while keeping the image vibrant */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] pointer-events-none z-10" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            🌾 Premium Agricultural Features
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Empowering modern farming practices with advanced AI intelligence and unified agricultural databases.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {list.map((item) => {
            const Icon = item.icon
            const targetLink = user ? item.link : `/auth/login?redirect=${item.link}`
            return (
              <div
                key={item.title}
                className={`p-6 rounded-2xl border flex flex-col justify-between hover:shadow-lg transition-shadow duration-300 ${item.bgColor}`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`text-2xl ${item.iconColor}`} />
                    <h3 className="font-bold text-lg flex items-center gap-1.5">
                      {item.title}
                      {!user && <FiLock className="text-gray-400 text-sm" />}
                    </h3>
                  </div>
                  <p className="text-sm opacity-90 leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>
                <Link
                  href={targetLink}
                  className="inline-flex items-center gap-1.5 text-sm font-bold hover:underline"
                >
                  {user ? 'Access Feature' : 'Login to Access'} <FiArrowRight />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
