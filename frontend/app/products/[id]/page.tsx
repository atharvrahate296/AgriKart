'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import ProductDetails from '@/components/product-details'
import VendorCard from '@/components/vendor-card'
import { getProduct } from '@/lib/api/products'

export default function ProductPage() {
  const params = useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      const data = await getProduct(params.id as string)
      setProduct(data)
      setLoading(false)
    }
    fetchProduct()
  }, [params.id])

  if (loading) return <div className="text-center py-20">Loading...</div>
  if (!product) return <div className="text-center py-20">Product not found</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProductDetails product={product} />
          </div>
          <div>
            <VendorCard vendor={product.vendor} productId={product.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
