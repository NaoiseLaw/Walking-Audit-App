'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface Route {
  id: string;
  name: string;
  description?: string;
  townCity: string;
  county: string;
  distanceMeters?: number;
  auditCount: number;
  avgScore?: number;
}

export default function RoutesPage() {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    apiClient.setToken(token);
    loadRoutes();
  }, [token, router]);

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ routes: Route[] }>('/v1/routes');
      setRoutes(response.routes);
    } catch (err: any) {
      if (err.status === 401) {
        router.push('/auth/login');
        return;
      }
      setError(err.message || 'Failed to load routes');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading routes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                  Walking Audit App
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/audits" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Audits
                </Link>
                <Link href="/routes" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Routes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Routes</h2>
              <p className="mt-1 text-sm text-gray-600">Browse routes or create your own</p>
            </div>
            <Link
              href="/routes/new"
              className="inline-flex items-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Route
            </Link>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {routes.map((route) => (
              <div key={route.id} className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900">{route.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {route.townCity}, {route.county}
                  </p>
                  {route.description && (
                    <p className="mt-2 text-sm text-gray-600">{route.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {route.auditCount} audits
                    </div>
                    {route.avgScore && (
                      <div className="text-sm font-medium text-gray-900">
                        Score: {(route.avgScore * 100).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/routes/${route.id}`}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      View details →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {routes.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No routes yet</h3>
              <p className="mt-1 text-sm text-gray-500">Create your first walking route to get started.</p>
              <div className="mt-6">
                <Link
                  href="/routes/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Route
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

