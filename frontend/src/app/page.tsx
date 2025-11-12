'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-4xl font-bold text-white">W</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4">
              Walking Audit App
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-8">
              Digitizing NTA Walkability Audits for Better Communities
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/auth/login"
                className="inline-flex items-center px-8 py-4 border border-transparent rounded-lg shadow-lg text-base font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition transform hover:scale-105"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-8 py-4 border border-gray-300 rounded-lg shadow-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">GPS Tracking</h3>
              <p className="text-gray-600">Track issues with precise location data using PostGIS spatial queries</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Photo Capture</h3>
              <p className="text-gray-600">Capture and tag photos automatically with location and EXIF data</p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-xl transition-shadow border border-gray-100">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF Reports</h3>
              <p className="text-gray-600">Generate comprehensive audit reports with charts and analytics</p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">Offline</div>
              <div className="text-sm text-gray-600 mt-1">First</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">Real-time</div>
              <div className="text-sm text-gray-600 mt-1">Sync</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">Mobile</div>
              <div className="text-sm text-gray-600 mt-1">Optimized</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">Analytics</div>
              <div className="text-sm text-gray-600 mt-1">Dashboard</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

