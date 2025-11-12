'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import AuditWizard from '@/components/AuditWizard';

export default function NewAuditPage() {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <a href="/dashboard" className="text-xl font-bold text-gray-900">
                  Walking Audit App
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <AuditWizard />
      </main>
    </div>
  );
}

