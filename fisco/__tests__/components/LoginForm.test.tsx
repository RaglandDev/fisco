import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from '@/components/login-form.client';
import { ClerkProvider } from '@clerk/nextjs';

// Mock the useRouter and usePathname hooks from Next.js
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),       // Mock push method
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: vi.fn().mockReturnValue('/'),  // Mock usePathname with a dummy return value
}));

// Mock ClerkProvider, useAuth, useUser, and useSignIn from @clerk/nextjs
vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  useUser: () => ({ user: null, isSignedIn: false }),
  useSignIn: () => ({
    isLoaded: true,
    signIn: {
      create: vi.fn().mockResolvedValue({
        status: 'complete',
        createdSessionId: 'mock-session-id',
      }),
      authenticateWithRedirect: vi.fn(),
    },
    setActive: vi.fn(),
  }),
    useSignUp: () => ({
    isLoaded: true,
    signUp: {
      create: vi.fn().mockResolvedValue({
        status: 'complete',
        createdSessionId: 'mock-session-id',
      }),
      authenticateWithRedirect: vi.fn(),
    },
    setActive: vi.fn(),
  }),
}));


it('renders the login form component', () => {
    render(
      <ClerkProvider>
        <LoginForm />
      </ClerkProvider>
      );
    
    // Check for the presence of the welcome message
    expect(screen.getByText(/welcome back/i)).toBeDefined();
    
  });