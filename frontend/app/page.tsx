import HeroSection from '@/components/hero-section'
import FeaturesInfo from '@/components/features-info'
import FeaturedProducts from '@/components/featured-products'
import CategoriesSection from '@/components/categories-section'
import CallToAction from '@/components/cta'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesInfo />
      
      {/* Shared background section wrapping both Shop by Category and Featured Products */}
      <div className="relative overflow-hidden border-y border-gray-100">
        {/* Background tractor spray image spanning both sections */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <Image
            src="/images/tractor_spray.png"
            alt="Agricultural backdrop"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Premium backdrop overlay for glassmorphic style and high text/card legibility */}
        <div className="absolute inset-0 bg-white/75 backdrop-blur-[1px] pointer-events-none z-10" />

        {/* Content layers above the background */}
        <div className="relative z-20">
          <CategoriesSection />
          <FeaturedProducts />
        </div>
      </div>

      <CallToAction />
    </>
  )
}

