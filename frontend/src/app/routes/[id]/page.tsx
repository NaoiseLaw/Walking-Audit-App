'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface RouteDetail {
  id: string;
  name: string;
  description?: string;
  townCity: string;
  county: string;
  eircode?: string;
  distanceMeters?: number;
  routeType?: string;
  surfaceType?: string;
  lighting?: string;
  hasPublicTransport?: boolean;
  auditCount: number;
  avgScore?: number;
  lastAudited?: string;
  isPublic?: boolean;
}

interface AuditSummary {
  id: string;
  auditDate: string;
  status: string;
  totalScore?: number;
  walkabilityRating?: string;
  coordinator?: { name: string };
}

export default function RouteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const token = useAppSelector((state) => state.auth.token);
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    apiClient.setToken(token);
    loadData();
  }, [token, router, params.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [routeData, auditsData] = await Promise.all([
        apiClient.get<RouteDetail>(`/v1/routes/${params.id}`),
        apiClient.get<{ audits: AuditSummary[] }>(`/v1/audits?routeId=${params.id}`),
      ]);
      setRoute(routeData);
      setAudits(auditsData.audits);
    } catch (err: any) {
      setError(err.message || 'Failed to load route');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading route...</p>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Route not found'}</p>
          <Link href="/routes" className="mt-4 inline-block text-blue-600 hover:text-blue-500">
            Back to routes
          </Link>
        </div>
      </div>
    );
  }

  const scorePercent = route.avgScore != null
    ? `${(route.avgScore * 100).toFixed(1)}%`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                  Walking Audit
                </h1>
              </Link>
              <div className="hidden sm:flex sm:space-x-1">
                <Link href="/dashboard" className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition">Dashboard</Link>
                <Link href="/audits" className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition">Audits</Link>
                <Link href="/routes" className="inline-flex items-center px-4 py-2 border-b-2 border-blue-500 text-sm font-medium text-gray-900">Routes</Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb + actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/routes" className="text-blue-600 hover:text-blue-500 text-sm mb-2 inline-block">
              ← Back to routes
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{route.name}</h1>
            <p className="mt-1 text-gray-500">{route.townCity}, {route.county}{route.eircode ? ` · ${route.eircode}` : ''}</p>
          </div>
          <Link
            href={`/audits/new?routeId=${route.id}`}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start Audit
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {/* Route info */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Route Details</h2>
            {route.description && (
              <p className="text-gray-600 mb-4">{route.description}</p>
            )}
            <dl className="grid grid-cols-2 gap-4">
              {route.distanceMeters != null && (
                <div>
                  <dt className="text-sm text-gray-500">Distance</dt>
                  <dd className="font-medium text-gray-900">{(route.distanceMeters / 1000).toFixed(2)} km</dd>
                </div>
              )}
              {route.routeType && (
                <div>
                  <dt className="text-sm text-gray-500">Type</dt>
                  <dd className="font-medium text-gray-900 capitalize">{route.routeType.replace(/_/g, ' ')}</dd>
                </div>
              )}
              {route.surfaceType && (
                <div>
                  <dt className="text-sm text-gray-500">Surface</dt>
                  <dd className="font-medium text-gray-900 capitalize">{route.surfaceType.replace(/_/g, ' ')}</dd>
                </div>
              )}
              {route.lighting && (
                <div>
                  <dt className="text-sm text-gray-500">Lighting</dt>
                  <dd className="font-medium text-gray-900 capitalize">{route.lighting.replace(/_/g, ' ')}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-gray-500">Public Transport</dt>
                <dd className="font-medium text-gray-900">{route.hasPublicTransport ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>

          {/* Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audit Stats</h2>
            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">{route.auditCount}</p>
                <p className="text-sm text-gray-500 mt-1">Total audits</p>
              </div>
              {scorePercent && (
                <div>
                  <p className="text-3xl font-bold text-blue-600">{scorePercent}</p>
                  <p className="text-sm text-gray-500 mt-1">Average score</p>
                </div>
              )}
              {route.lastAudited && (
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(route.lastAudited).toLocaleDateString('en-IE', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Last audited</p>
                </div>
              )}
              {route.auditCount === 0 && (
                <p className="text-sm text-gray-500">No audits yet. Be the first!</p>
              )}
            </div>
          </div>
        </div>

        {/* Audit history */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Audit History</h2>
          </div>
          {audits.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {audits.map((audit) => (
                <Link
                  key={audit.id}
                  href={`/audits/${audit.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(audit.auditDate).toLocaleDateString('en-IE', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          audit.status === 'completed' ? 'bg-green-100 text-green-800' :
                          audit.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {audit.status.replace(/_/g, ' ')}
                        </span>
                        {audit.coordinator && (
                          <span className="text-xs text-gray-500">by {audit.coordinator.name}</span>
                        )}
                      </div>
                    </div>
                    {audit.totalScore != null && (
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{audit.totalScore}<span className="text-sm text-gray-500 font-normal"> / 35</span></p>
                        {audit.walkabilityRating && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                            audit.walkabilityRating === 'Excellent' ? 'bg-green-100 text-green-800' :
                            audit.walkabilityRating === 'Good' ? 'bg-blue-100 text-blue-800' :
                            audit.walkabilityRating === 'OK' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {audit.walkabilityRating}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No audits yet</h3>
              <p className="mt-2 text-sm text-gray-500">This route has not been audited yet.</p>
              <Link
                href={`/audits/new?routeId=${route.id}`}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition"
              >
                Start the first audit
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
