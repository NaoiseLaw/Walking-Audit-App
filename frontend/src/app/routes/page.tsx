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
    apiClient.setToken(token || null);
    loadRoutes();
  }, [token]);

  const loadRoutes = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ routes: Route[] }>('/v1/routes');
      setRoutes(response.routes);
    } catch (err: any) {
      setError(err.message || 'Failed to load routes');
    } finally {
      setIsLoading(false);
    }
  };

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
              <p className="mt-1 text-sm text-gray-600">Browse available routes</p>
            </div>
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
              <p className="text-gray-500">No routes found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

