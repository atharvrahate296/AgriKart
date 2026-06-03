import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgriKart - Farmers to Vendors Network',
  description: 'Modern e-commerce platform connecting farmers with vendors and retailers for agricultural products',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
