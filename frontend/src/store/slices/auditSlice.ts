import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuditFormState {
  currentStep: number;
  routeId: string | null;
  auditDate: string | null;
  participants: any[];
  sections: Record<string, any>;
  issues: any[];
  photos: any[];
  isDraft: boolean;
}

const initialState: AuditFormState = {
  currentStep: 0,
  routeId: null,
  auditDate: null,
  participants: [],
  sections: {},
  issues: [],
  photos: [],
  isDraft: true,
};

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setRouteId: (state, action: PayloadAction<string>) => {
      state.routeId = action.payload;
    },
    setAuditDate: (state, action: PayloadAction<string>) => {
      state.auditDate = action.payload;
    },
    addParticipant: (state, action: PayloadAction<any>) => {
      state.participants.push(action.payload);
    },
    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter(
        (p) => p.id !== action.payload
      );
    },
    updateSection: (
      state,
      action: PayloadAction<{ section: string; data: any }>
    ) => {
      state.sections[action.payload.section] = action.payload.data;
    },
    addIssue: (state, action: PayloadAction<any>) => {
      state.issues.push(action.payload);
    },
    removeIssue: (state, action: PayloadAction<string>) => {
      state.issues = state.issues.filter((i) => i.id !== action.payload);
    },
    addPhoto: (state, action: PayloadAction<any>) => {
      state.photos.push(action.payload);
    },
    removePhoto: (state, action: PayloadAction<string>) => {
      state.photos = state.photos.filter((p) => p.id !== action.payload);
    },
    resetAudit: (state) => {
      return initialState;
    },
    setDraft: (state, action: PayloadAction<boolean>) => {
      state.isDraft = action.payload;
    },
  },
});

export const {
  setCurrentStep,
  setRouteId,
  setAuditDate,
  addParticipant,
  removeParticipant,
  updateSection,
  addIssue,
  removeIssue,
  addPhoto,
  removePhoto,
  resetAudit,
  setDraft,
} = auditSlice.actions;

export default auditSlice.reducer;

