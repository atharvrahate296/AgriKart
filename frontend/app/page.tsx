import HeroSection from '@/components/hero-section'
import FeaturesInfo from '@/components/features-info'
import Footer from '@/components/footer'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesInfo />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-700 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Ready to eliminate intermediaries?
          </h2>
          <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
            Whether you&apos;re a bulk buyer looking for reliable supply or a farmer seeking confirmed demand —
            AgriKart connects you directly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 bg-white text-green-700 px-8 py-3.5 rounded-xl font-bold hover:bg-green-50 transition shadow-lg"
            >
              Join as Buyer
            </a>
            <a
              href="/auth/signup"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-3.5 rounded-xl font-bold hover:bg-white/10 transition"
            >
              Join as Farmer / FPO
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
