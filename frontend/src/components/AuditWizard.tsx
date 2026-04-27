'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCurrentStep, updateSection, setRouteId, setAuditDate } from '@/store/slices/auditSlice';
import { apiClient } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface Route {
  id: string;
  name: string;
  townCity: string;
  county: string;
}

interface Audit {
  id: string;
  routeId: string;
  auditDate: string;
  sections: any[];
  status: string;
}

const SECTIONS = [
  'footpaths',
  'facilities',
  'crossing_road',
  'road_user_behaviour',
  'safety',
  'look_and_feel',
  'school_gates',
] as const;

export default function AuditWizard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const currentStep = useAppSelector((state) => state.audit.currentStep);
  const routeId = useAppSelector((state) => state.audit.routeId);
  const auditDate = useAppSelector((state) => state.audit.auditDate);
  const sections = useAppSelector((state) => state.audit.sections);

  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load routes on mount
  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      loadRoutes();
    }
  }, [token]);

  const loadRoutes = async () => {
    try {
      const response = await apiClient.get<{ routes: Route[] }>('/v1/routes');
      setRoutes(response.routes);
    } catch (err: any) {
      setError(err.message || 'Failed to load routes');
    }
  };

  const handleRouteSelect = (route: Route) => {
    setSelectedRoute(route);
    dispatch(setRouteId(route.id));
  };

  const handleSectionScore = (section: string, score: number) => {
    dispatch(
      updateSection({
        section,
        data: {
          section,
          score,
          responses: sections[section]?.responses || {},
          comments: sections[section]?.comments || '',
          problemAreas: sections[section]?.problemAreas || [],
        },
      })
    );
  };

  const handleNext = () => {
    if (currentStep === 0 && !routeId) {
      setError('Please select a route');
      return;
    }
    if (currentStep < SECTIONS.length) {
      dispatch(setCurrentStep(currentStep + 1));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      dispatch(setCurrentStep(currentStep - 1));
    }
  };

  const handleSubmit = async () => {
    if (!routeId || !auditDate) {
      setError('Please complete all required fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const sectionsData = Object.values(sections).map((section) => ({
        section: section.section,
        score: section.score,
        responses: section.responses,
        comments: section.comments,
        problemAreas: section.problemAreas,
      }));

      const audit = await apiClient.post<Audit>('/v1/audits', {
        routeId,
        auditDate,
        sections: sectionsData,
        status: 'completed',
      });

      router.push(`/audits/${audit.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create audit');
    } finally {
      setIsLoading(false);
    }
  };

  const currentSection = currentStep > 0 ? SECTIONS[currentStep - 1] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep + 1} of {SECTIONS.length + 1}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / (SECTIONS.length + 1)) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-700 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / (SECTIONS.length + 1)) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Create New Audit</h2>
            <p className="mt-1 text-sm text-blue-100">
              {currentStep === 0
                ? 'Select a route and date to begin'
                : `Evaluating: ${currentSection?.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`}
            </p>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start">
                <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* Step 0: Route Selection */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Route
                  </label>
                  <select
                    value={selectedRoute?.id || ''}
                    onChange={(e) => {
                      const route = routes.find((r) => r.id === e.target.value);
                      if (route) handleRouteSelect(route);
                    }}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition"
                  >
                    <option value="">Select a route...</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} - {route.townCity}, {route.county}
                      </option>
                    ))}
                  </select>
                  {selectedRoute && (
                    <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">{selectedRoute.name}</p>
                      <p className="text-sm text-blue-700">{selectedRoute.townCity}, {selectedRoute.county}</p>
                    </div>
                  )}
                  <div className="mt-3">
                    <a
                      href="/routes/new"
                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Or create a new route on the map
                    </a>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Audit Date
                  </label>
                  <input
                    type="date"
                    value={auditDate || ''}
                    onChange={(e) => dispatch(setAuditDate(e.target.value))}
                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition"
                  />
                </div>
              </div>
            )}

            {/* Section Steps */}
            {currentSection && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 capitalize mb-6">
                    {currentSection.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-4">
                        Rate this section (1 = Poor, 5 = Excellent)
                      </label>
                      <div className="grid grid-cols-5 gap-3">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <button
                            key={score}
                            type="button"
                            onClick={() => handleSectionScore(currentSection, score)}
                            className={`py-4 px-4 rounded-lg border-2 font-semibold transition-all ${
                              sections[currentSection]?.score === score
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600 shadow-md transform scale-105'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="text-2xl font-bold">{score}</div>
                            <div className="text-xs mt-1">
                              {score === 1 ? 'Poor' : score === 2 ? 'Fair' : score === 3 ? 'OK' : score === 4 ? 'Good' : 'Excellent'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Additional Comments
                      </label>
                      <textarea
                        value={sections[currentSection]?.comments || ''}
                        onChange={(e) =>
                          dispatch(
                            updateSection({
                              section: currentSection,
                              data: {
                                ...sections[currentSection],
                                comments: e.target.value,
                              },
                            })
                          )
                        }
                        rows={5}
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition"
                        placeholder="Add any additional notes or observations about this section..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {currentStep < SECTIONS.length ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                >
                  Next
                  <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit Audit
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
