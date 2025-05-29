import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommentButton from '@/components/PostActions/CommentButton';

// Mock the dependencies
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn()
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

// Import the mocked modules
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

describe('CommentButton', () => {
  // Sample post data
  const mockPost = {
    id: 'post-123',
    comment_count: 42,
    // Add other required post properties as needed
  };

  const mockOnCommentClick = vi.fn();
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default router mock implementation
    (useRouter as any).mockReturnValue({
      push: mockPush
    });
  });

  it('renders correctly with comment count', () => {
    // Mock user as logged in
    (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

    render(<CommentButton post={mockPost} onCommentClick={mockOnCommentClick} />);
    
    // Check if the button and comment count are rendered
    const button = screen.getByRole('button', { name: /comment button/i });
    expect(button).toBeInTheDocument();
    
    const commentCount = screen.getByText('42');
    expect(commentCount).toBeInTheDocument();
  });

  it('calls onCommentClick when clicked and user is logged in', () => {
    // Mock user as logged in
    (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

    render(<CommentButton post={mockPost} onCommentClick={mockOnCommentClick} />);
    
    // Click the button
    const button = screen.getByRole('button', { name: /comment button/i });
    fireEvent.click(button);
    
    // Verify onCommentClick was called with the post ID
    expect(mockOnCommentClick).toHaveBeenCalledTimes(1);
    expect(mockOnCommentClick).toHaveBeenCalledWith('post-123');
    
    // Verify router.push was not called
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to login page when clicked and user is not logged in', () => {
    // Mock user as not logged in
    (useUser as any).mockReturnValue({ user: null });

    render(<CommentButton post={mockPost} onCommentClick={mockOnCommentClick} />);
    
    // Click the button
    const button = screen.getByRole('button', { name: /comment button/i });
    fireEvent.click(button);
    
    // Verify onCommentClick was not called
    expect(mockOnCommentClick).not.toHaveBeenCalled();
    
    // Verify router.push was called with the login path
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('applies hover styles correctly', () => {
    // Mock user as logged in
    (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

    render(<CommentButton post={mockPost} onCommentClick={mockOnCommentClick} />);
    
    // Check if the button has the correct classes for hover effects
    const button = screen.getByRole('button', { name: /comment button/i });
    expect(button).toHaveClass('hover:scale-110');
    
    // Check if the icon has the correct classes for hover effects
    const icon = button.querySelector('svg');
    expect(icon).toHaveClass('hover:text-blue-400');
  });
});