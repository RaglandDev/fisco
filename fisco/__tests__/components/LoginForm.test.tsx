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


it('renders the login form component', () => {
    render(
      <ClerkProvider>
        <LoginForm />
      </ClerkProvider>
      );
    
    // Check for the presence of the welcome message
    expect(screen.getByText(/welcome back/i)).toBeDefined();
    
  });