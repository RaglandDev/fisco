import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event'

import { vi, it, expect } from 'vitest';
import { ClerkProvider } from '@clerk/nextjs';
import BottomBar from '@/components/BottomBar.client'

// Mock the useRouter and usePathname hooks from Next.js
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),       // Mock push method
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: vi.fn().mockReturnValue('/'),  // Mock usePathname with a dummy return value
}));


it('renders bottom bar', async () => {
 
  render(
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <BottomBar/>
    </ClerkProvider>
    )
});
