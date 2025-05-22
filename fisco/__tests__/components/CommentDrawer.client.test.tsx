// CommentDrawer.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import CommentDrawer from "@/components/CommentDrawer.client"

// Mock useAuth and useRouter
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

it('redirects to login and does not render drawer when user is not signed in', async () => {
  const pushMock = vi.fn();
  (useAuth as jest.Mock).mockReturnValue({
    isSignedIn: false,
    isLoaded: true,
  });
  (useRouter as jest.Mock).mockReturnValue({
    push: pushMock,
  });

  const onOpenChangeMock = vi.fn();

  render(<CommentDrawer open={true} onOpenChange={onOpenChangeMock} />);

  await waitFor(() => {
    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
    expect(pushMock).toHaveBeenCalledWith('/login');
  });

  // The drawer should not be rendered
  expect(screen.queryByLabelText('Comment form')).toEqual(null);
});

// it('renders drawer when user is signed in', async () => {
//   (useAuth as jest.Mock).mockReturnValue({
//     isSignedIn: true,
//     isLoaded: true,
//   });
//   (useRouter as jest.Mock).mockReturnValue({
//     push: vi.fn(),
//   });

//   const onOpenChangeMock = vi.fn();

//   render(<CommentDrawer open={true} onOpenChange={onOpenChangeMock} />);

//     await waitFor(() => {
//   // The drawer should be rendered
//   expect(screen.getByLabelText('Comment form')).toBeDefined();
//   });

// });
