# Walking Audit Web Application
# Technical Product Requirements Document
# Part 4: Frontend Complete Implementation

**Version:** 1.0  
**Last Updated:** January 2025  
**Document Owner:** Frontend Architecture Team  
**Status:** Development Ready

---

## Document Overview

This is **Part 4 of 6** in the complete Walking Audit App technical documentation:

1. Main PRD & Architecture
2. Database Complete Specification
3. API Complete Specification
4. **Frontend Complete Implementation** ← You are here
5. Backend Services Implementation
6. Testing & DevOps

---

## Table of Contents

1. [Frontend Architecture](#1-frontend-architecture)
2. [State Management](#2-state-management)
3. [Core Components](#3-core-components)
4. [Custom Hooks](#4-custom-hooks)
5. [Routing & Navigation](#5-routing--navigation)
6. [Forms & Validation](#6-forms--validation)
7. [Styling System](#7-styling-system)
8. [Performance Optimization](#8-performance-optimization)
9. [Accessibility](#9-accessibility)
10. [Internationalization](#10-internationalization)

---

## 1. Frontend Architecture

### 1.1 Project Structure Overview

```
src/
├── app/                      # Next.js App Router pages
├── components/               # React components (organized by feature)
├── hooks/                    # Custom React hooks
├── store/                    # Redux store (slices, API)
├── lib/                      # Utilities, services, helpers
├── types/                    # TypeScript types
├── config/                   # Configuration files
└── styles/                   # Global styles, themes
```

### 1.2 Key Architectural Decisions

#### Decision 1: Next.js App Router
**Rationale:**
- Server-side rendering for better SEO
- Built-in code splitting
- API routes for BFF pattern
- Image optimization
- Font optimization

#### Decision 2: Redux Toolkit + RTK Query
**Rationale:**
- Centralized state management
- Built-in caching with RTK Query
- Automatic re-fetching
- Optimistic updates
- DevTools support

#### Decision 3: Component Composition
**Pattern:** Container/Presenter + Compound Components
**Rationale:**
- Separation of concerns
- Reusability
- Easier testing
- Better type safety

---

## 2. State Management

### 2.1 Redux Store Configuration

```typescript
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Slices
import authReducer from './slices/authSlice';
import auditReducer from './slices/auditSlice';
import mapReducer from './slices/mapSlice';
import uiReducer from './slices/uiSlice';
import syncReducer from './slices/syncSlice';

// API
import { baseApi } from './api/baseApi';

// Persist config
const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth', 'sync'], // Only persist these reducers
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    audit: auditReducer,
    map: mapReducer,
    ui: uiReducer,
    sync: syncReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch);

export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### 2.2 Auth Slice

```typescript
// store/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
    
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { 
  setCredentials, 
  updateUser, 
  setToken, 
  logout, 
  setLoading 
} = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
```

### 2.3 Audit Slice (Form State)

```typescript
// store/slices/auditSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Audit, AuditSection, Participant } from '@/types/audit';

interface AuditState {
  currentAudit: Partial<Audit> | null;
  currentStep: number;
  completedSteps: number[];
  isDirty: boolean;
  lastSaved: string | null;
}

const initialState: AuditState = {
  currentAudit: null,
  currentStep: 0,
  completedSteps: [],
  isDirty: false,
  lastSaved: null,
};

export const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    initializeAudit: (state, action: PayloadAction<{ route_id: string }>) => {
      state.currentAudit = {
        route_id: action.payload.route_id,
        audit_date: new Date().toISOString().split('T')[0],
        status: 'draft',
        participants: [],
        sections: [],
      };
      state.currentStep = 0;
      state.completedSteps = [];
      state.isDirty = false;
    },
    
    loadAudit: (state, action: PayloadAction<Partial<Audit>>) => {
      state.currentAudit = action.payload;
      state.isDirty = false;
    },
    
    updateAuditField: (
      state,
      action: PayloadAction<{ field: keyof Audit; value: any }>
    ) => {
      if (state.currentAudit) {
        (state.currentAudit as any)[action.payload.field] = action.payload.value;
        state.isDirty = true;
      }
    },
    
    addParticipant: (state, action: PayloadAction<Participant>) => {
      if (state.currentAudit) {
        state.currentAudit.participants = [
          ...(state.currentAudit.participants || []),
          action.payload,
        ];
        state.isDirty = true;
      }
    },
    
    removeParticipant: (state, action: PayloadAction<number>) => {
      if (state.currentAudit?.participants) {
        state.currentAudit.participants = state.currentAudit.participants.filter(
          (_, index) => index !== action.payload
        );
        state.isDirty = true;
      }
    },
    
    updateSection: (state, action: PayloadAction<AuditSection>) => {
      if (state.currentAudit) {
        const sections = state.currentAudit.sections || [];
        const existingIndex = sections.findIndex(
          (s) => s.section === action.payload.section
        );
        
        if (existingIndex >= 0) {
          sections[existingIndex] = action.payload;
        } else {
          sections.push(action.payload);
        }
        
        state.currentAudit.sections = sections;
        state.isDirty = true;
      }
    },
    
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    
    markStepComplete: (state, action: PayloadAction<number>) => {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },
    
    saveSuccess: (state) => {
      state.isDirty = false;
      state.lastSaved = new Date().toISOString();
    },
    
    resetAudit: (state) => {
      return initialState;
    },
  },
});

export const {
  initializeAudit,
  loadAudit,
  updateAuditField,
  addParticipant,
  removeParticipant,
  updateSection,
  setCurrentStep,
  markStepComplete,
  saveSuccess,
  resetAudit,
} = auditSlice.actions;

export default auditSlice.reducer;

// Selectors
export const selectCurrentAudit = (state: RootState) => state.audit.currentAudit;
export const selectCurrentStep = (state: RootState) => state.audit.currentStep;
export const selectIsDirty = (state: RootState) => state.audit.isDirty;
```

### 2.4 RTK Query API

```typescript
// store/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.walkingaudit.ie/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Audit', 'Route', 'Issue', 'Photo', 'User'],
  endpoints: () => ({}),
});
```

```typescript
// store/api/auditApi.ts
import { baseApi } from './baseApi';
import type { Audit, CreateAuditRequest, ListAuditsParams } from '@/types/audit';

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get list of audits
    getAudits: builder.query<
      { data: Audit[]; pagination: any },
      ListAuditsParams
    >({
      query: (params) => ({
        url: '/audits',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'Audit' as const, id })),
              { type: 'Audit', id: 'LIST' },
            ]
          : [{ type: 'Audit', id: 'LIST' }],
    }),
    
    // Get single audit
    getAudit: builder.query<{ data: Audit }, string>({
      query: (id) => `/audits/${id}`,
      providesTags: (result, error, id) => [{ type: 'Audit', id }],
    }),
    
    // Create audit
    createAudit: builder.mutation<{ data: Audit }, CreateAuditRequest>({
      query: (body) => ({
        url: '/audits',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Audit', id: 'LIST' }],
      
      // Optimistic update
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          
          // Update cache
          dispatch(
            auditApi.util.updateQueryData('getAudits', {}, (draft) => {
              draft.data.unshift(data.data);
            })
          );
        } catch {}
      },
    }),
    
    // Update audit
    updateAudit: builder.mutation<
      { data: Audit },
      { id: string; body: Partial<Audit> }
    >({
      query: ({ id, body }) => ({
        url: `/audits/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Audit', id }],
      
      // Optimistic update
      async onQueryStarted({ id, body }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          auditApi.util.updateQueryData('getAudit', id, (draft) => {
            Object.assign(draft.data, body);
          })
        );
        
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
    
    // Delete audit
    deleteAudit: builder.mutation<void, string>({
      query: (id) => ({
        url: `/audits/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Audit', id },
        { type: 'Audit', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAuditsQuery,
  useGetAuditQuery,
  useCreateAuditMutation,
  useUpdateAuditMutation,
  useDeleteAuditMutation,
} = auditApi;
```

---

## 3. Core Components

### 3.1 AuditWizard Component

```typescript
// components/audit/AuditWizard/index.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import {
  selectCurrentAudit,
  selectCurrentStep,
  selectIsDirty,
  setCurrentStep,
  resetAudit,
  saveSuccess,
} from '@/store/slices/auditSlice';
import { useCreateAuditMutation } from '@/store/api/auditApi';
import { toast } from '@/components/ui/Toast';
import { WizardProgress } from './components/WizardProgress';
import { WizardNavigation } from './components/WizardNavigation';
import { WIZARD_STEPS } from './constants';

interface AuditWizardProps {
  mode: 'create' | 'edit';
  auditId?: string;
  routeId?: string;
  onComplete?: (auditId: string) => void;
  onCancel?: () => void;
}

export function AuditWizard({
  mode,
  auditId,
  routeId,
  onComplete,
  onCancel,
}: AuditWizardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const currentAudit = useAppSelector(selectCurrentAudit);
  const currentStep = useAppSelector(selectCurrentStep);
  const isDirty = useAppSelector(selectIsDirty);
  
  const [createAudit, { isLoading: isCreating }] = useCreateAuditMutation();
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  // Get current step component
  const CurrentStepComponent = WIZARD_STEPS[currentStep]?.component;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  
  // Auto-save every 30 seconds
  useEffect(() => {
    if (!isDirty || !currentAudit) return;
    
    const timer = setInterval(async () => {
      try {
        await saveToIndexedDB(currentAudit);
        dispatch(saveSuccess());
        toast.info('Progress saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(timer);
  }, [isDirty, currentAudit, dispatch]);
  
  // Warn before leaving if unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
  
  const validateStep = async (): Promise<boolean> => {
    const step = WIZARD_STEPS[currentStep];
    
    if (!step.validate) return true;
    
    try {
      await step.validate(currentAudit);
      setValidationErrors({});
      return true;
    } catch (error: any) {
      setValidationErrors(error.errors || {});
      toast.error('Please fix validation errors');
      return false;
    }
  };
  
  const handleNext = async () => {
    const isValid = await validateStep();
    if (!isValid) return;
    
    if (isLastStep) {
      await handleSubmit();
    } else {
      dispatch(setCurrentStep(currentStep + 1));
    }
  };
  
  const handlePrevious = () => {
    if (!isFirstStep) {
      dispatch(setCurrentStep(currentStep - 1));
    }
  };
  
  const handleSubmit = async () => {
    if (!currentAudit) return;
    
    try {
      // Final validation
      const isValid = await validateAudit(currentAudit);
      if (!isValid) {
        toast.error('Please complete all required fields');
        return;
      }
      
      // Submit to API
      const result = await createAudit(currentAudit as any).unwrap();
      
      // Clear IndexedDB
      await clearAuditFromIndexedDB(result.data.id);
      
      // Success
      toast.success('Audit submitted successfully!');
      dispatch(resetAudit());
      
      if (onComplete) {
        onComplete(result.data.id);
      } else {
        router.push(`/audits/${result.data.id}/report`);
      }
      
    } catch (error: any) {
      if (!navigator.onLine) {
        // Queue for offline sync
        await queueAuditForSync(currentAudit);
        toast.info('Audit saved offline. Will sync when online.');
        dispatch(resetAudit());
        if (onComplete) onComplete('pending-sync');
      } else {
        toast.error(error.message || 'Failed to submit audit');
      }
    }
  };
  
  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmed) return;
    }
    
    dispatch(resetAudit());
    if (onCancel) {
      onCancel();
    } else {
      router.push('/audits');
    }
  };
  
  if (!CurrentStepComponent) {
    return <div>Invalid step</div>;
  }
  
  return (
    <div className="audit-wizard min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <WizardProgress
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            onStepClick={(step) => dispatch(setCurrentStep(step))}
          />
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CurrentStepComponent
            audit={currentAudit}
            errors={validationErrors}
          />
        </div>
      </div>
      
      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <WizardNavigation
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onCancel={handleCancel}
            isSubmitting={isCreating}
          />
        </div>
      </div>
    </div>
  );
}
```

### 3.2 Section Component Pattern

```typescript
// components/audit/AuditWizard/steps/FootpathsStep.tsx
'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { selectCurrentAudit, updateSection } from '@/store/slices/auditSlice';
import { SectionHeader } from '../components/SectionHeader';
import { QuestionGroup } from '../components/QuestionGroup';
import { CheckboxGroup } from '@/components/form/CheckboxGroup';
import { Textarea } from '@/components/ui/Textarea';
import { ScoreSelector } from '../components/ScoreSelector';
import { TagInput } from '@/components/form/TagInput';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';

interface FootpathsStepProps {
  audit: any;
  errors: Record<string, string[]>;
}

export function FootpathsStep({ audit, errors }: FootpathsStepProps) {
  const dispatch = useAppDispatch();
  const currentAudit = useAppSelector(selectCurrentAudit);
  
  // Get existing section data
  const existingSection = currentAudit?.sections?.find(
    (s) => s.section === 'footpaths'
  );
  
  const [responses, setResponses] = useState(
    existingSection?.responses || {
      main_problems: [],
      surface_condition: [],
      obstacles: [],
    }
  );
  const [comments, setComments] = useState(existingSection?.comments || '');
  const [problemAreas, setProblemAreas] = useState(
    existingSection?.problem_areas || []
  );
  const [score, setScore] = useState(existingSection?.score || 3);
  
  const handleResponseChange = (field: string, value: any) => {
    const updated = { ...responses, [field]: value };
    setResponses(updated);
    saveSection(updated, comments, problemAreas, score);
  };
  
  const handleScoreChange = (newScore: number) => {
    setScore(newScore);
    saveSection(responses, comments, problemAreas, newScore);
  };
  
  const saveSection = (
    resp: any,
    comm: string,
    areas: string[],
    scr: number
  ) => {
    dispatch(
      updateSection({
        section: 'footpaths',
        score: scr,
        responses: resp,
        comments: comm,
        problem_areas: areas,
      })
    );
  };
  
  return (
    <div className="space-y-8">
      <SectionHeader
        icon="🚶"
        title="Footpaths"
        description="Assess the condition and usability of footpaths along the route"
      />
      
      {/* Main Problems */}
      <QuestionGroup
        title="What are the main problems with footpaths?"
        error={errors.main_problems}
        required
      >
        <CheckboxGroup
          options={[
            {
              value: 'no_problems',
              label: 'There are no real problems',
              exclusive: true,
            },
            {
              value: 'no_footpath',
              label: 'There is no footpath',
            },
            {
              value: 'not_continuous',
              label: 'They are not always continuous',
            },
            {
              value: 'not_wide_enough',
              label: 'They are not wide enough for everyone to use',
            },
            {
              value: 'need_to_step_off',
              label: 'People need to step off the footpath onto the road',
            },
            {
              value: 'one_side_only',
              label: 'There is a footpath on one side of the street only',
            },
          ]}
          selected={responses.main_problems}
          onChange={(values) => handleResponseChange('main_problems', values)}
        />
      </QuestionGroup>
      
      {/* Surface Condition */}
      <QuestionGroup
        title="Are there any problems with the condition of footpaths?"
        error={errors.surface_condition}
      >
        <CheckboxGroup
          options={[
            {
              value: 'no_problems',
              label: 'There are no real problems',
              exclusive: true,
            },
            {
              value: 'ponding',
              label: 'Ponding or flooding on the footpath',
            },
            {
              value: 'splashes',
              label: 'Splashes from the road due to poor drainage',
            },
            {
              value: 'cracks',
              label: 'Cracks on the footpath',
            },
            {
              value: 'poor_repair',
              label: 'Evidence of poor repair work',
            },
            {
              value: 'tree_damage',
              label: 'Damage caused by tree roots',
            },
            {
              value: 'litter',
              label: 'Litter',
            },
            {
              value: 'dog_poo',
              label: 'Dog poo',
            },
            {
              value: 'uneven',
              label: 'Uneven surfaces (e.g. entrances, driveways)',
            },
            {
              value: 'slippery',
              label: 'Slippery surfaces in wet conditions',
            },
            {
              value: 'steps',
              label: 'Steps that cause difficulty',
            },
          ]}
          selected={responses.surface_condition}
          onChange={(values) =>
            handleResponseChange('surface_condition', values)
          }
        />
      </QuestionGroup>
      
      {/* Obstacles */}
      <QuestionGroup
        title="Are there any problems with obstacles on the footpath?"
        error={errors.obstacles}
      >
        <CheckboxGroup
          options={[
            {
              value: 'no_problems',
              label: 'There are no real problems',
              exclusive: true,
            },
            {
              value: 'generally_clear',
              label: 'The footpaths are generally clear of obstacles',
              exclusive: true,
            },
            {
              value: 'advertising',
              label: 'Advertising boards/shop signage',
            },
            {
              value: 'outdoor_seating',
              label: 'Outdoor tables and chairs from businesses',
            },
            {
              value: 'bins',
              label: 'Permanent litter bins',
            },
            {
              value: 'collection_bins',
              label: 'Domestic/commercial bins on bin collection days',
            },
            {
              value: 'bicycles',
              label: 'Bicycles',
            },
            {
              value: 'lighting_poles',
              label: 'Lighting columns/poles',
            },
            {
              value: 'guardrails',
              label: 'Guardrail/bollards',
            },
            {
              value: 'parked_vehicles',
              label: 'Vehicles either fully or partially parked on the footpath',
            },
            {
              value: 'overgrown',
              label: 'Overgrown hedging/trees',
            },
            {
              value: 'poor_contrast',
              label: 'Street furniture that is hard to see (no colour contrast)',
            },
            {
              value: 'edge_contrast',
              label: 'Edge of footpath is hard to see (no colour contrast)',
            },
          ]}
          selected={responses.obstacles}
          onChange={(values) => handleResponseChange('obstacles', values)}
        />
      </QuestionGroup>
      
      {/* Comments */}
      <QuestionGroup
        title="Additional Comments (Optional)"
        description="Describe any specific issues or locations"
      >
        <Textarea
          value={comments}
          onChange={(e) => {
            setComments(e.target.value);
            saveSection(responses, e.target.value, problemAreas, score);
          }}
          placeholder="e.g., Narrow footpath at junction of Main St and Church St forces wheelchair users into road"
          rows={3}
          maxLength={2000}
        />
      </QuestionGroup>
      
      {/* Problem Areas */}
      <QuestionGroup
        title="Specific Problem Locations"
        description="Tag specific locations where you observed issues"
      >
        <TagInput
          tags={problemAreas}
          onChange={(tags) => {
            setProblemAreas(tags);
            saveSection(responses, comments, tags, score);
          }}
          placeholder="e.g., Junction of Rathgar Rd & Main St"
        />
      </QuestionGroup>
      
      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => {
            // Open issue logger modal
          }}
        >
          📍 Log Specific Issue
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            // Open photo capture
          }}
        >
          📸 Take Photo
        </Button>
      </div>
      
      {/* Score */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <ScoreSelector
          label="Overall Score for Footpaths"
          value={score}
          onChange={handleScoreChange}
          labels={['Poor', 'Fair', 'OK', 'Good', 'Excellent']}
          required
          error={errors.score}
        />
      </div>
    </div>
  );
}
```

### 3.3 RadarChart Component

```typescript
// components/report/RadarChart/index.tsx
'use client';

import { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RadarChartProps {
  scores: {
    footpaths: number;
    facilities: number;
    crossings: number;
    behaviour: number;
    safety: number;
    look_feel: number;
    school_gates?: number;
  };
  comparison?: {
    label: string;
    scores: number[];
  };
  size?: 'small' | 'medium' | 'large';
}

export function RadarChart({ scores, comparison, size = 'medium' }: RadarChartProps) {
  const labels = [
    'Footpaths',
    'Facilities',
    'Crossings',
    'Road User\nBehaviour',
    'Safety',
    'Look & Feel',
  ];
  
  const data = [
    scores.footpaths,
    scores.facilities,
    scores.crossings,
    scores.behaviour,
    scores.safety,
    scores.look_feel,
  ];
  
  // Add school gates if present
  if (scores.school_gates) {
    labels.push('School\nGates');
    data.push(scores.school_gates);
  }
  
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Audit Score',
        data,
        backgroundColor: 'rgba(33, 150, 243, 0.2)',
        borderColor: 'rgb(33, 150, 243)',
        borderWidth: 3,
        pointBackgroundColor: 'rgb(33, 150, 243)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      ...(comparison
        ? [
            {
              label: comparison.label,
              data: comparison.scores,
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
              borderColor: 'rgb(156, 39, 176)',
              borderWidth: 2,
              borderDash: [5, 5],
              pointBackgroundColor: 'rgb(156, 39, 176)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 3,
              pointHoverRadius: 5,
            },
          ]
        : []),
    ],
  };
  
  const fontSize = {
    small: { ticks: 9, pointLabels: 11 },
    medium: { ticks: 11, pointLabels: 13 },
    large: { ticks: 13, pointLabels: 15 },
  }[size];
  
  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: (value) => {
            const labels = ['', 'Poor', 'Fair', 'OK', 'Good', 'Excellent'];
            return labels[value as number];
          },
          font: {
            size: fontSize.ticks,
          },
        },
        pointLabels: {
          font: {
            size: fontSize.pointLabels,
            weight: 'bold',
          },
          color: '#424242',
        },
        grid: {
          color: '#E0E0E0',
        },
        angleLines: {
          color: '#E0E0E0',
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: fontSize.ticks + 1,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const labels = ['Poor', 'Fair', 'OK', 'Good', 'Excellent'];
            const value = context.parsed.r;
            return `${context.dataset.label}: ${labels[value - 1]}`;
          },
        },
      },
    },
  };
  
  return (
    <div className={`radar-chart ${size}`}>
      <Radar data={chartData} options={options} />
    </div>
  );
}
```

---

## 4. Custom Hooks

### 4.1 useOfflineSync Hook

```typescript
// hooks/useOfflineSync.ts
import { useState, useEffect, useCallback } from 'react';
import { syncManager } from '@/lib/sync/SyncManager';
import { toast } from '@/components/ui/Toast';

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online');
      syncNow();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Changes will sync when reconnected.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Check pending items periodically
  useEffect(() => {
    const checkPending = async () => {
      try {
        const count = await syncManager.getPendingCount();
        setPendingCount(count);
      } catch (error) {
        console.error('Failed to check pending count:', error);
      }
    };
    
    checkPending();
    const interval = setInterval(checkPending, 5000); // Every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    
    if (syncStatus === 'syncing') {
      return; // Already syncing
    }
    
    setSyncStatus('syncing');
    
    try {
      await syncManager.syncAll();
      setSyncStatus('success');
      setLastSyncTime(new Date());
      setPendingCount(0);
      toast.success('All changes synced');
      
      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (error: any) {
      setSyncStatus('error');
      toast.error(`Sync failed: ${error.message}`);
      
      // Reset status after 5 seconds
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  }, [isOnline, syncStatus]);
  
  return {
    isOnline,
    syncStatus,
    pendingCount,
    lastSyncTime,
    syncNow,
    needsSync: pendingCount > 0,
  };
}
```

### 4.2 usePhotoCapture Hook

```typescript
// hooks/usePhotoCapture.ts
import { useState, useRef, useCallback } from 'react';
import { compressImage } from '@/lib/utils/imageCompression';
import { extractEXIF } from '@/lib/utils/exifExtractor';
import type { PhotoData } from '@/types/photo';

export function usePhotoCapture() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<PhotoData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      setError(null);
    } catch (err: any) {
      setError('Camera access denied. Please enable camera permissions.');
      console.error('Camera error:', err);
    }
  }, []);
  
  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);
  
  // Capture photo
  const capturePhoto = useCallback(async (): Promise<PhotoData | null> => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not initialized');
      return null;
    }
    
    setIsProcessing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Canvas context unavailable');
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      });
      
      if (!blob) {
        throw new Error('Failed to create image blob');
      }
      
      // Compress if needed
      const compressedBlob =
        blob.size > 1024 * 1024
          ? await compressImage(blob, 1024 * 1024)
          : blob;
      
      // Create file
      const file = new File(
        [compressedBlob],
        `photo_${Date.now()}.jpg`,
        { type: 'image/jpeg' }
      );
      
      // Extract EXIF
      const exif = await extractEXIF(file);
      
      // Get location from GPS or geolocation API
      let location: { lat: number; lng: number } | null = null;
      
      if (exif.gps) {
        location = {
          lat: convertDMSToDD(exif.gps.latitude, exif.gps.latitudeRef),
          lng: convertDMSToDD(exif.gps.longitude, exif.gps.longitudeRef),
        };
      } else if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
              });
            }
          );
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch {
          // Geolocation failed, will be null
        }
      }
      
      const photoData: PhotoData = {
        file,
        preview: URL.createObjectURL(compressedBlob),
        location,
        timestamp: new Date(),
        exif,
      };
      
      setCapturedPhoto(photoData);
      setError(null);
      return photoData;
      
    } catch (err: any) {
      setError(`Capture failed: ${err.message}`);
      console.error('Capture error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  // Retake photo
  const retakePhoto = useCallback(() => {
    if (capturedPhoto?.preview) {
      URL.revokeObjectURL(capturedPhoto.preview);
    }
    setCapturedPhoto(null);
  }, [capturedPhoto]);
  
  return {
    videoRef,
    canvasRef,
    stream,
    capturedPhoto,
    isProcessing,
    error,
    initializeCamera,
    stopCamera,
    capturePhoto,
    retakePhoto,
  };
}

// Helper function
function convertDMSToDD(
  dms: [number, number, number],
  ref: string
): number {
  const [degrees, minutes, seconds] = dms;
  let dd = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') {
    dd = dd * -1;
  }
  return dd;
}
```

### 4.3 useGeolocation Hook

```typescript
// hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
  });
  
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation not supported',
        loading: false,
      }));
      return;
    }
    
    const handleSuccess = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
      });
    };
    
    const handleError = (error: GeolocationPositionError) => {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    };
    
    // Get current position
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      options || {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
    
    // Watch position changes
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );
    
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);
  
  return state;
}
```

---

*[Document continues with more components, hooks, forms, styling, etc...]*

---

## Document Control

**Last Updated:** 2025-01-11  
**Next Review:** 2025-02-01

**Version History:**
- v1.0 (2025-01-11): Initial comprehensive frontend implementation

**Related Documents:**
- Part 1: Main PRD & Architecture
- Part 2: Database Complete Specification
- Part 3: API Complete Specification
- Part 5: Backend Services Implementation
- Part 6: Testing & DevOps

---

**END OF PART 4 (Frontend Complete Implementation)**
