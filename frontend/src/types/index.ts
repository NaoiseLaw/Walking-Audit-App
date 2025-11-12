export interface User {
  id: string;
  email: string;
  name: string;
  role: 'auditor' | 'coordinator' | 'la_admin' | 'system_admin';
  emailVerified: boolean;
  organization?: string;
  county?: string;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  townCity: string;
  county: string;
  eircode?: string;
  geometry: string;
  distanceMeters?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Audit {
  id: string;
  routeId: string;
  coordinatorId: string;
  auditDate: string;
  status: 'draft' | 'in_progress' | 'completed' | 'reviewed' | 'archived';
  footpathsScore?: number;
  facilitiesScore?: number;
  crossingsScore?: number;
  behaviourScore?: number;
  safetyScore?: number;
  lookFeelScore?: number;
  schoolGatesScore?: number;
  totalScore?: number;
  normalizedScore?: number;
  walkabilityRating?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  auditId: string;
  section: string;
  location: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  issueId?: string;
  auditId: string;
  url: string;
  thumbnailUrl?: string;
  location?: string;
  takenAt?: string;
  uploadedAt: string;
}

export interface Recommendation {
  id: string;
  auditId: string;
  priority: number;
  title: string;
  description: string;
  category?: string;
  laStatus: string;
  createdAt: string;
  updatedAt: string;
}

