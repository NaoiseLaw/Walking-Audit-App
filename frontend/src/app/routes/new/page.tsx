'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

interface Waypoint {
  lat: number;
  lng: number;
}

const IRISH_COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
];

export default function NewRoutePage() {
  const router = useRouter();
  const token = useAppSelector((state) => state.auth.token);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [townCity, setTownCity] = useState('');
  const [county, setCounty] = useState('');
  const [eircode, setEircode] = useState('');

  // Map state
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapReady) return;

    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.maps) {
        clearInterval(checkGoogle);
        initMap();
      }
    }, 200);

    return () => clearInterval(checkGoogle);
  }, [mapReady]);

  const initMap = () => {
    if (!mapRef.current) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 53.3498, lng: -6.2603 }, // Dublin default
      zoom: 14,
      mapTypeControl: true,
      streetViewControl: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'simplified' }] },
      ],
    });

    // Try to center on user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {} // silently fall back to Dublin
      );
    }

    map.addListener('click', (e: any) => {
      if (e.latLng) {
        addWaypoint({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    });

    mapInstanceRef.current = map;
    setMapReady(true);
  };

  const addWaypoint = useCallback((point: Waypoint) => {
    setWaypoints((prev) => [...prev, point]);
  }, []);

  // Update markers and polyline when waypoints change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Clear old polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Add markers
    waypoints.forEach((wp, i) => {
      const isFirst = i === 0;
      const isLast = i === waypoints.length - 1 && waypoints.length > 1;

      const marker = new google.maps.Marker({
        position: wp,
        map: mapInstanceRef.current,
        label: {
          text: isFirst ? 'A' : isLast ? 'B' : `${i + 1}`,
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '12px',
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: isFirst ? '#16a34a' : isLast ? '#dc2626' : '#2563eb',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        draggable: true,
        title: isFirst ? 'Start' : isLast ? 'End' : `Waypoint ${i + 1}`,
      });

      // Allow dragging markers to adjust
      marker.addListener('dragend', (e: any) => {
        if (e.latLng) {
          setWaypoints((prev) => {
            const updated = [...prev];
            updated[i] = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            return updated;
          });
        }
      });

      // Right-click to remove
      marker.addListener('rightclick', () => {
        setWaypoints((prev) => prev.filter((_, idx) => idx !== i));
      });

      markersRef.current.push(marker);
    });

    // Draw polyline
    if (waypoints.length >= 2) {
      const path = waypoints.map((wp) => new google.maps.LatLng(wp.lat, wp.lng));

      polylineRef.current = new google.maps.Polyline({
        path,
        map: mapInstanceRef.current,
        strokeColor: '#2563eb',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        geodesic: true,
      });

      // Calculate distance
      const dist = google.maps.geometry.spherical.computeLength(path);
      setDistanceMeters(Math.round(dist));
    } else {
      setDistanceMeters(null);
    }
  }, [waypoints, mapReady]);

  const clearWaypoints = () => {
    setWaypoints([]);
  };

  const undoLastPoint = () => {
    setWaypoints((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('Route name is required'); return; }
    if (!townCity.trim()) { setError('Town/city is required'); return; }
    if (!county) { setError('County is required'); return; }
    if (waypoints.length < 2) { setError('Please place at least 2 points on the map to define the route'); return; }

    setIsSubmitting(true);

    try {
      apiClient.setToken(token!);

      // Build GeoJSON LineString from all waypoints
      const geometry = JSON.stringify({
        type: 'LineString',
        coordinates: waypoints.map((wp) => [wp.lng, wp.lat]),
      });

      const route = await apiClient.post<{ id: string }>('/v1/routes', {
        name: name.trim(),
        description: description.trim() || undefined,
        townCity: townCity.trim(),
        county,
        eircode: eircode.trim() || undefined,
        geometry,
        startPoint: waypoints[0],
        endPoint: waypoints[waypoints.length - 1],
        distanceMeters,
      });

      router.push(`/routes/${route.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create route');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) return null;

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
                <Link href="/routes" className="border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Routes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/routes" className="text-sm text-blue-600 hover:text-blue-500">
            ← Back to Routes
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Panel — takes 2/3 on desktop */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Draw Your Route</h2>
                  <p className="text-sm text-blue-100 mt-1">
                    Click on the map to place waypoints. Drag markers to adjust. Right-click to remove.
                  </p>
                </div>

                {/* Map */}
                <div ref={mapRef} className="w-full h-[500px]" />

                {/* Map toolbar */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-green-600"></span> Start
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-blue-600"></span> Waypoint
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-full bg-red-600"></span> End
                    </span>
                    {distanceMeters && (
                      <span className="font-medium text-gray-900">
                        {distanceMeters >= 1000
                          ? `${(distanceMeters / 1000).toFixed(2)} km`
                          : `${distanceMeters} m`}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={undoLastPoint}
                      disabled={waypoints.length === 0}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={clearWaypoints}
                      disabled={waypoints.length === 0}
                      className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>

              {/* Waypoint count */}
              <p className="mt-2 text-sm text-gray-500">
                {waypoints.length === 0
                  ? 'Click the map to place your first point'
                  : waypoints.length === 1
                  ? '1 point placed — click again to set the route end'
                  : `${waypoints.length} points — route defined`}
              </p>
            </div>

            {/* Form Panel — takes 1/3 on desktop */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Route Details</h2>
                </div>

                <div className="p-6 space-y-5">
                  {error && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Route Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Grafton Street to St Stephen's Green"
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Describe the route, key landmarks, etc."
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Town / City *
                    </label>
                    <input
                      type="text"
                      value={townCity}
                      onChange={(e) => setTownCity(e.target.value)}
                      placeholder="e.g. Dublin"
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      County *
                    </label>
                    <select
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                    >
                      <option value="">Select county...</option>
                      {IRISH_COUNTIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Eircode
                    </label>
                    <input
                      type="text"
                      value={eircode}
                      onChange={(e) => setEircode(e.target.value)}
                      placeholder="e.g. D02 VK60"
                      className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
                    />
                  </div>

                  {distanceMeters && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-sm font-medium text-blue-800">
                        Route distance: {distanceMeters >= 1000
                          ? `${(distanceMeters / 1000).toFixed(2)} km`
                          : `${distanceMeters} m`}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Route...
                      </>
                    ) : (
                      'Create Route'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
