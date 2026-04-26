import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AuditWizard from './AuditWizard';
import auditSlice from '@/store/slices/auditSlice';
import authSlice from '@/store/slices/authSlice';

// Mock API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    setToken: jest.fn(),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const createMockStore = () => {
  return configureStore({
    reducer: {
      auth: authSlice,
      audit: auditSlice,
    },
    preloadedState: {
      auth: {
        user: null,
        token: 'test-token',
        refreshToken: null,
        isAuthenticated: true,
        isLoading: false,
      },
      audit: {
        currentStep: 0,
        routeId: null,
        auditDate: null,
        participants: [],
        sections: {},
        issues: [],
        photos: [],
        isDraft: true,
      },
    },
  });
};

describe('AuditWizard', () => {
  it('should render audit wizard', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <AuditWizard />
      </Provider>
    );

    expect(screen.getByText('Create Audit')).toBeInTheDocument();
  });

  it('should show route selection on first step', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <AuditWizard />
      </Provider>
    );

    expect(screen.getByText('Select Route')).toBeInTheDocument();
  });
});

