import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SaveButton from '@/components/PostActions/SaveButton';

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

describe('SaveButton', () => {
  // Sample post data
  const mockPostUnsaved = {
    id: 'post-123',
    saves: ['other-user-1', 'other-user-2'],
    // Add other required post properties as needed
  };

  const mockPostSaved = {
    id: 'post-123',
    saves: ['user-123', 'other-user-1', 'other-user-2'],
    // Add other required post properties as needed
  };

  const mockOnSaveChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default router mock implementation
    (useRouter as any).mockReturnValue({
      push: mockPush
    });
  });

  describe('Rendering', () => {
    it('renders correctly for unauthenticated user', () => {
      (useUser as any).mockReturnValue({ user: null });

      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      expect(button).toBeInTheDocument();
      
      const bookmarkIcon = button.querySelector('svg');
      expect(bookmarkIcon).toHaveClass('text-white');
      expect(bookmarkIcon).not.toHaveClass('text-yellow-500', 'fill-yellow-500', 'scale-110');
    });

    it('renders correctly for authenticated user who has not saved the post', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      expect(button).toBeInTheDocument();
      
      const bookmarkIcon = button.querySelector('svg');
      expect(bookmarkIcon).toHaveClass('text-white');
      expect(bookmarkIcon).not.toHaveClass('text-yellow-500', 'fill-yellow-500', 'scale-110');
    });

    it('renders correctly for authenticated user who has saved the post', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(<SaveButton post={mockPostSaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      expect(button).toBeInTheDocument();
      
      const bookmarkIcon = button.querySelector('svg');
      expect(bookmarkIcon).toHaveClass('text-yellow-500', 'fill-yellow-500', 'scale-110');
      expect(bookmarkIcon).not.toHaveClass('text-white');
    });
  });

  describe('Unauthenticated User Behavior', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: null });
    });

    it('shows alert and redirects to login when unauthenticated user clicks save', () => {
      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      fireEvent.click(button);
      
      expect(mockAlert).toHaveBeenCalledWith('Please sign in to save posts!');
      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockOnSaveChange).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Authenticated User Save Functionality', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
    });

    it('successfully saves a post (optimistic update)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      fireEvent.click(button);
      
      // Check optimistic update
      expect(mockOnSaveChange).toHaveBeenCalledWith({
        ...mockPostUnsaved,
        saves: ['other-user-1', 'other-user-2', 'user-123']
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/profile',
          {
            method: 'POST',
            body: JSON.stringify({ post_id: 'post-123', userId: 'user-123' })
          }
        );
      });
      
      expect(mockAlert).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('successfully unsaves a post (optimistic update)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<SaveButton post={mockPostSaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      fireEvent.click(button);
      
      // Check optimistic update
      expect(mockOnSaveChange).toHaveBeenCalledWith({
        ...mockPostSaved,
        saves: ['other-user-1', 'other-user-2']
      });
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/profile',
          {
            method: 'DELETE',
            body: JSON.stringify({ post_id: 'post-123', userId: 'user-123' })
          }
        );
      });
    });

    it('reverts optimistic update when API call fails (save)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      fireEvent.click(button);
      
      // Check optimistic update
      expect(mockOnSaveChange).toHaveBeenNthCalledWith(1, {
        ...mockPostUnsaved,
        saves: ['other-user-1', 'other-user-2', 'user-123']
      });
      
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error saving post:', expect.any(Error));
        
        // Check revert update
        expect(mockOnSaveChange).toHaveBeenNthCalledWith(2, {
          ...mockPostUnsaved,
          saves: ['other-user-1', 'other-user-2']
        });
      });
    });

  });

  describe('Save In Progress State', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
    });

    it('prevents multiple save requests when save is in progress', async () => {
      // Mock a slow API response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true }), 100))
      );

      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      
      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      // Only one optimistic update should occur
      expect(mockOnSaveChange).toHaveBeenCalledTimes(1);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it('unlocks save button after API call completes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
      
      // Should be able to click again after API call completes
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });
      
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Styling and Accessibility', () => {
    it('applies correct hover styles', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      expect(button).toHaveClass('hover:scale-110');
      
      const bookmarkIcon = button.querySelector('svg');
      expect(bookmarkIcon).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });

    it('has proper aria-label for accessibility', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      expect(button).toHaveAttribute('aria-label', 'Save button');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty saves array', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
      const postWithNoSaves = { ...mockPostUnsaved, saves: [] };

      render(<SaveButton post={postWithNoSaves} onSaveChange={mockOnSaveChange} />);
      
      const bookmarkIcon = screen.getByRole('button').querySelector('svg');
      expect(bookmarkIcon).toHaveClass('text-white');
      expect(bookmarkIcon).not.toHaveClass('text-yellow-500', 'fill-yellow-500', 'scale-110');
    });

    it('handles user ID that is not in saves array', () => {
      (useUser as any).mockReturnValue({ user: { id: 'non-existent-user' } });

      render(<SaveButton post={mockPostSaved} onSaveChange={mockOnSaveChange} />);
      
      const bookmarkIcon = screen.getByRole('button').querySelector('svg');
      expect(bookmarkIcon).toHaveClass('text-white');
      expect(bookmarkIcon).not.toHaveClass('text-yellow-500', 'fill-yellow-500', 'scale-110');
    });

    it('handles undefined user ID', () => {
      (useUser as any).mockReturnValue({ user: { } }); // User without ID
      
      render(<SaveButton post={mockPostSaved} onSaveChange={mockOnSaveChange} />);
      
      const bookmarkIcon = screen.getByRole('button').querySelector('svg');
      expect(bookmarkIcon).toHaveClass('text-white');
      expect(bookmarkIcon).not.toHaveClass('text-yellow-500', 'fill-yellow-500', 'scale-110');
      
      // Click should still work but not cause errors
      const button = screen.getByRole('button', { name: /save button/i });
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe('API Endpoint Behavior', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
    });

    it('calls the correct API endpoint with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<SaveButton post={mockPostUnsaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/profile',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ post_id: 'post-123', userId: 'user-123' })
          })
        );
      });
    });

    it('uses DELETE method when unsaving a post', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<SaveButton post={mockPostSaved} onSaveChange={mockOnSaveChange} />);
      
      const button = screen.getByRole('button', { name: /save button/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/profile',
          expect.objectContaining({
            method: 'DELETE',
            body: JSON.stringify({ post_id: 'post-123', userId: 'user-123' })
          })
        );
      });
    });
  });
});