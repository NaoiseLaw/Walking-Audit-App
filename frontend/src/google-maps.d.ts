/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Minimal Google Maps type declarations for runtime usage.
 * The full API is loaded via script tag in layout.tsx.
 */
declare namespace google.maps {
  class Map {
    constructor(el: HTMLElement, opts?: any);
    addListener(event: string, handler: any): void;
    setCenter(center: any): void;
    setZoom(zoom: number): void;
  }
  class Marker {
    constructor(opts?: any);
    addListener(event: string, handler: any): void;
    setMap(map: any): void;
  }
  class Polyline {
    constructor(opts?: any);
    setMap(map: any): void;
    getPath(): any;
  }
  class LatLng {
    constructor(lat: number, lng: number);
    lat(): number;
    lng(): number;
  }
  interface MapMouseEvent {
    latLng?: { lat(): number; lng(): number };
  }
  const SymbolPath: {
    CIRCLE: any;
    FORWARD_CLOSED_ARROW: any;
    FORWARD_OPEN_ARROW: any;
    BACKWARD_CLOSED_ARROW: any;
    BACKWARD_OPEN_ARROW: any;
  };
  namespace geometry {
    namespace spherical {
      function computeLength(path: any[]): number;
      function computeDistanceBetween(from: any, to: any): number;
    }
  }
}
