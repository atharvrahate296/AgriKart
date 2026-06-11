import HeroSection from '@/components/hero-section'
import FeaturesInfo from '@/components/features-info'
import FeaturedProducts from '@/components/featured-products'
import CategoriesSection from '@/components/categories-section'
import CallToAction from '@/components/cta'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesInfo />
      <CategoriesSection />
      <FeaturedProducts />
      <CallToAction />
    </>
  )
}
