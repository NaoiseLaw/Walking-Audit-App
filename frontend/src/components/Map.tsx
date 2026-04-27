'use client';

import { useEffect, useRef } from 'react';

interface MapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title?: string }>;
  onMarkerClick?: (marker: { lat: number; lng: number }) => void;
  onMapClick?: (location: { lat: number; lng: number }) => void;
}

export default function Map({ center, zoom = 13, markers = [], onMarkerClick, onMapClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || !window.google) {
      return;
    }

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      center: center || { lat: 53.3498, lng: -6.2603 }, // Dublin default
      zoom,
    });

    mapInstanceRef.current = map;

    // Add click listener
    if (onMapClick) {
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onMapClick({
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          });
        }
      });
    }

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) {
      return;
    }

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const marker = new google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map: mapInstanceRef.current,
        title: markerData.title,
      });

      if (onMarkerClick) {
        marker.addListener('click', () => {
          onMarkerClick(markerData);
        });
      }

      markersRef.current.push(marker);
    });
  }, [markers, onMarkerClick]);

  useEffect(() => {
    if (!mapInstanceRef.current || !center) {
      return;
    }

    mapInstanceRef.current.setCenter(center);
    mapInstanceRef.current.setZoom(zoom);
  }, [center, zoom]);

  return (
    <div className="w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {typeof window !== 'undefined' && !window.google && (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <p className="text-gray-500">Loading map...</p>
        </div>
      )}
    </div>
  );
}

