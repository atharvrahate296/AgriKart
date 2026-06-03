'use client'

import Link from 'next/link'

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl">
          ✉️
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Check Your Email</h1>
        <p className="text-gray-600 mb-8">
          We have sent a verification link to your email address. Please click the link in the email to verify your account and complete registration.
        </p>
        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition block text-center"
          >
            Go to Login
          </Link>
          <Link
            href="/"
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition block text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
