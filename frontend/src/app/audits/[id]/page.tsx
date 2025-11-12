'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface Audit {
  id: string;
  routeId: string;
  auditDate: string;
  status: string;
  totalScore?: number;
  walkabilityRating?: string;
  route: {
    name: string;
    townCity: string;
    county: string;
  };
  sections: Array<{
    section: string;
    score: number;
    comments?: string;
  }>;
  issues: Array<{
    id: string;
    title: string;
    category: string;
    severity: string;
  }>;
}

export default function AuditDetailPage() {
  const router = useRouter();
  const params = useParams();
  const token = useAppSelector((state) => state.auth.token);
  const [audit, setAudit] = useState<Audit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    apiClient.setToken(token);
    loadAudit();
  }, [token, router, params.id]);

  const loadAudit = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<Audit>(`/v1/audits/${params.id}`);
      setAudit(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit');
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
          <p className="mt-4 text-gray-600">Loading audit...</p>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error || 'Audit not found'}</p>
          <Link href="/audits" className="mt-4 inline-block text-blue-600 hover:text-blue-500">
            Back to audits
          </Link>
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
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <Link href="/audits" className="text-blue-600 hover:text-blue-500 mb-4 inline-block">
              ← Back to audits
            </Link>
            <h2 className="text-2xl font-bold text-gray-900">{audit.route.name}</h2>
            <p className="text-sm text-gray-600">
              {audit.route.townCity}, {audit.route.county} • {new Date(audit.auditDate).toLocaleDateString()}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Overview</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-500">Status</span>
                  <p className="text-lg font-medium capitalize">{audit.status}</p>
                </div>
                {audit.totalScore && (
                  <div>
                    <span className="text-sm text-gray-500">Total Score</span>
                    <p className="text-lg font-medium">{audit.totalScore}</p>
                  </div>
                )}
                {audit.walkabilityRating && (
                  <div>
                    <span className="text-sm text-gray-500">Walkability Rating</span>
                    <p className="text-lg font-medium">{audit.walkabilityRating}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Section Scores</h3>
              <div className="space-y-2">
                {audit.sections.map((section) => (
                  <div key={section.section} className="flex justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {section.section.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-medium">{section.score}/5</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {audit.issues.length > 0 && (
            <div className="mt-6 bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Issues</h3>
              <div className="space-y-4">
                {audit.issues.map((issue) => (
                  <div key={issue.id} className="border-l-4 border-red-500 pl-4">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-900">{issue.title}</h4>
                      <span className="text-sm text-gray-500 capitalize">{issue.severity}</span>
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{issue.category}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

