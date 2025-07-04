import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event'

import { vi, it, expect } from 'vitest';
import { ClerkProvider } from '@clerk/nextjs';
import DropDownMenu from '@/components/DropDown.client'

// Mock the useRouter and usePathname hooks from Next.js
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),       // Mock push method
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: vi.fn().mockReturnValue('/'),  // Mock usePathname with a dummy return value
}));

vi.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }) => <div>{children}</div>,
  useAuth: () => ({ isSignedIn: false, isLoaded: true }),
  useUser: () => ({ user: null, isSignedIn: false }),
}));


it('renders bottom bar', async () => {
 
  render(
    <ClerkProvider>
      <DropDownMenu/>
    </ClerkProvider>
    )
});
