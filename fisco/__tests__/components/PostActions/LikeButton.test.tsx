import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LikeButton from '@/components/PostActions/LikeButton';

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

// Mock global functions
const mockAlert = vi.fn();
const mockConsoleError = vi.fn();
const mockFetch = vi.fn();
const mockPush = vi.fn();

global.alert = mockAlert;
global.console.error = mockConsoleError;
global.fetch = mockFetch;

// Mock environment variable
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';

describe('LikeButton', () => {
  // Sample post data
  const mockPostUnliked = {
    id: 'post-123',
    likes: ['other-user-1', 'other-user-2'],
    // Add other required post properties as needed
  };

  const mockPostLiked = {
    id: 'post-123',
    likes: ['user-123', 'other-user-1', 'other-user-2'],
    // Add other required post properties as needed
  };

  const mockOnLikeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default router mock implementation
    (useRouter as any).mockReturnValue({
      push: mockPush
    });
  });

  describe('Rendering', () => {
    it('renders correctly with like count for unauthenticated user', () => {
      (useUser as any).mockReturnValue({ user: null });

      render(<LikeButton post={mockPostUnliked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      expect(button).toBeInTheDocument();
      
      const likeCount = screen.getByText('2');
      expect(likeCount).toBeInTheDocument();
      
      const heartIcon = button.querySelector('svg');
      expect(heartIcon).toHaveClass('text-white');
      expect(heartIcon).not.toHaveClass('text-red-500', 'fill-red-500', 'scale-110');
    });

    it('renders correctly for authenticated user who has not liked the post', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(<LikeButton post={mockPostUnliked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      expect(button).toBeInTheDocument();
      
      const likeCount = screen.getByText('2');
      expect(likeCount).toBeInTheDocument();
      
      const heartIcon = button.querySelector('svg');
      expect(heartIcon).toHaveClass('text-white');
      expect(heartIcon).not.toHaveClass('text-red-500', 'fill-red-500', 'scale-110');
    });

    it('renders correctly for authenticated user who has liked the post', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(<LikeButton post={mockPostLiked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      expect(button).toBeInTheDocument();
      
      const likeCount = screen.getByText('3');
      expect(likeCount).toBeInTheDocument();
      
      const heartIcon = button.querySelector('svg');
      expect(heartIcon).toHaveClass('text-red-500', 'fill-red-500', 'scale-110');
      expect(heartIcon).not.toHaveClass('text-white');
    });
  });

  describe('Unauthenticated User Behavior', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: null });
    });

    it('shows alert and redirects to login when unauthenticated user clicks like', () => {
      render(<LikeButton post={mockPostUnliked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      fireEvent.click(button);
      
      expect(mockAlert).toHaveBeenCalledWith('Please sign in to like posts!');
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockOnLikeChange).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated User Like Functionality', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
    });

    it('successfully likes a post (optimistic update)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<LikeButton post={mockPostUnliked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      fireEvent.click(button);
      
      // Check optimistic update
      expect(mockOnLikeChange).toHaveBeenCalledWith({
        ...mockPostUnliked,
        likes: ['other-user-1', 'other-user-2', 'user-123']
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/testendpoint',
          {
            method: 'POST',
            body: JSON.stringify({ post_id: 'post-123', userId: 'user-123' })
          }
        );
      });
      
      expect(mockAlert).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('successfully unlikes a post (optimistic update)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<LikeButton post={mockPostLiked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      fireEvent.click(button);
      
      // Check optimistic update
      expect(mockOnLikeChange).toHaveBeenCalledWith({
        ...mockPostLiked,
        likes: ['other-user-1', 'other-user-2']
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/testendpoint',
          {
            method: 'DELETE',
            body: JSON.stringify({ post_id: 'post-123', userId: 'user-123' })
          }
        );
      });
    });

    it('reverts optimistic update when API call fails (like)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<LikeButton post={mockPostUnliked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      fireEvent.click(button);
      
      // Check optimistic update
      expect(mockOnLikeChange).toHaveBeenNthCalledWith(1, {
        ...mockPostUnliked,
        likes: ['other-user-1', 'other-user-2', 'user-123']
      });
      
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error liking post:', expect.any(Error));
        
        // Check revert update
        expect(mockOnLikeChange).toHaveBeenNthCalledWith(2, {
          ...mockPostUnliked,
          likes: ['other-user-1', 'other-user-2']
        });
      });
    });

  });

  describe('Like In Progress State', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
    });

    it('prevents multiple like requests when like is in progress', async () => {
      // Mock a slow API response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(<LikeButton post={mockPostUnliked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Only one optimistic update should occur
      expect(mockOnLikeChange).toHaveBeenCalledTimes(1);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Styling and Accessibility', () => {
    it('applies correct hover styles', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(<LikeButton post={mockPostUnliked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      expect(button).toHaveClass('hover:scale-110');
      
      const heartIcon = button.querySelector('svg');
      expect(heartIcon).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });

    it('has proper aria-label for accessibility', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(<LikeButton post={mockPostUnliked} onLikeChange={mockOnLikeChange} />);
      
      const button = screen.getByRole('button', { name: /like button/i });
      expect(button).toHaveAttribute('aria-label', 'Like button');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty likes array', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
      const postWithNoLikes = { ...mockPostUnliked, likes: [] };

      render(<LikeButton post={postWithNoLikes} onLikeChange={mockOnLikeChange} />);
      
      const likeCount = screen.getByText('0');
      expect(likeCount).toBeInTheDocument();
      
      const heartIcon = screen.getByRole('button').querySelector('svg');
      expect(heartIcon).toHaveClass('text-white');
    });

    it('handles user ID that is not in likes array', () => {
      (useUser as any).mockReturnValue({ user: { id: 'non-existent-user' } });

      render(<LikeButton post={mockPostLiked} onLikeChange={mockOnLikeChange} />);
      
      const heartIcon = screen.getByRole('button').querySelector('svg');
      expect(heartIcon).toHaveClass('text-white');
      expect(heartIcon).not.toHaveClass('text-red-500', 'fill-red-500', 'scale-110');
    });
  });
});