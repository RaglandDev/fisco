// test/ClientHeader.test.tsx

import { render, screen } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import { ClerkProvider } from '@clerk/nextjs';
import ClientHeader from '@/components/ClientHeader.client';

// Mock the useRouter and usePathname hooks from Next.js
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: vi.fn().mockReturnValue('/'),
}));

// Mock the entire @clerk/nextjs module
vi.mock('@clerk/nextjs', async () => {
  const actual = await vi.importActual<typeof import('@clerk/nextjs')>();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  useUser: () => ({ user: null, isSignedIn: false }),
}));

import { useAuth } from '@clerk/nextjs';

it('renders client header with logout button when user is signed in', () => {
  (useAuth as jest.Mock).mockReturnValue({
    userId: 'user_123',
    isLoaded: true,
    isSignedIn: true,
  });

  render(
    <ClerkProvider>
      <ClientHeader />
    </ClerkProvider>
  );
    await waitFor(async () => {
      expect(screen.getByLabelText('Sign out button')).toBeDefined()
    });
});


it('renders login button when user is logged out', () => {
  // Mock useAuth to return null userId
  (useAuth as jest.Mock).mockReturnValue({
    userId: null,
    isLoaded: true,
    isSignedIn: false,
  });

  render(
    <ClerkProvider>
      <ClientHeader />
    </ClerkProvider>
  );

  await waitFor(async () => {
      expect(screen.getByLabelText('Login link')).toBeDefined()
    });
});