import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteButton from '@/components/PostActions/DeleteButton';

// Mock the dependencies
vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn()
}));

// Mock the shadcn/ui components
vi.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open, onOpenChange }: any) => 
    open ? <div data-testid="alert-dialog" onClick={() => onOpenChange(false)}>{children}</div> : null,
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <h2 data-testid="alert-dialog-title">{children}</h2>,
  AlertDialogDescription: ({ children }: any) => <p data-testid="alert-dialog-description">{children}</p>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogCancel: ({ children, ...props }: any) => 
    <button data-testid="alert-dialog-cancel" {...props}>{children}</button>,
  AlertDialogAction: ({ children, onClick, ...props }: any) => 
    <button data-testid="alert-dialog-action" onClick={onClick} {...props}>{children}</button>,
}));

// Import the mocked modules
import { useUser } from '@clerk/nextjs';

// Mock global functions
const mockAlert = vi.fn();
const mockConsoleLog = vi.fn();
const mockFetch = vi.fn();

global.alert = mockAlert;
global.console.log = mockConsoleLog;
global.fetch = mockFetch;

describe('DeleteButton', () => {
  // Sample post data
  const mockPost = {
    id: 'post-123',
    fk_author_id: 'user-123',
    // Add other required post properties as needed
  };

  const mockOnPostDeleted = vi.fn();
  const userUUID = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visibility Logic', () => {
    it('renders delete button when user is the author', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      const deleteButton = screen.getByRole('button', { name: /delete button/i });
      expect(deleteButton).toBeInTheDocument();
    });

    it('does not render when user is not logged in', () => {
      (useUser as any).mockReturnValue({ user: null });

      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      const deleteButton = screen.queryByRole('button', { name: /delete button/i });
      expect(deleteButton).not.toBeInTheDocument();
    });

    it('does not render when userUUID is null', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });

      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={null} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      const deleteButton = screen.queryByRole('button', { name: /delete button/i });
      expect(deleteButton).not.toBeInTheDocument();
    });


    it('does not render when post author does not match userUUID', () => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
      const postWithDifferentAuthor = { ...mockPost, fk_author_id: 'different-author' };

      render(
        <DeleteButton 
          post={postWithDifferentAuthor} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      const deleteButton = screen.queryByRole('button', { name: /delete button/i });
      expect(deleteButton).not.toBeInTheDocument();
    });
  });

  describe('Dialog Functionality', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
    });

    it('opens confirmation dialog when delete button is clicked', () => {
      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      const deleteButton = screen.getByRole('button', { name: /delete button/i });
      fireEvent.click(deleteButton);
      
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('alert-dialog-title')).toHaveTextContent('Delete Post');
      expect(screen.getByTestId('alert-dialog-description')).toHaveTextContent(
        'Are you sure you want to delete this post? This action cannot be undone.'
      );
      expect(mockConsoleLog).toHaveBeenCalledWith('Delete button clicked for post:', 'post-123');
    });

    it('closes dialog when cancel is clicked', () => {
      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      // Open dialog
      const deleteButton = screen.getByRole('button', { name: /delete button/i });
      fireEvent.click(deleteButton);
      
      // Click cancel
      const cancelButton = screen.getByTestId('alert-dialog-cancel');
      fireEvent.click(cancelButton);
      
      expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Delete Functionality', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
    });

    it('successfully deletes post and calls onPostDeleted', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      // Open dialog and click delete
      const deleteButton = screen.getByRole('button', { name: /delete button/i });
      fireEvent.click(deleteButton);
      
      const confirmDeleteButton = screen.getByTestId('alert-dialog-action');
      fireEvent.click(confirmDeleteButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/posts', {
          method: 'DELETE',
          body: JSON.stringify({ postId: 'post-123' })
        });
        expect(mockOnPostDeleted).toHaveBeenCalledWith('post-123');
      });
      
      // Dialog should be closed
      expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
    });

    it('handles API error response with error message', async () => {
      const errorMessage = 'Post not found';
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage })
      });

      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      // Open dialog and click delete
      const deleteButton = screen.getByRole('button', { name: /delete button/i });
      fireEvent.click(deleteButton);
      
      const confirmDeleteButton = screen.getByTestId('alert-dialog-action');
      fireEvent.click(confirmDeleteButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(errorMessage);
        expect(mockOnPostDeleted).not.toHaveBeenCalled();
      });
      
      // Dialog should be closed
      expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
    });

    it('handles API error response without error message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      // Open dialog and click delete
      const deleteButton = screen.getByRole('button', { name: /delete button/i });
      fireEvent.click(deleteButton);
      
      const confirmDeleteButton = screen.getByTestId('alert-dialog-action');
      fireEvent.click(confirmDeleteButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to delete post');
        expect(mockOnPostDeleted).not.toHaveBeenCalled();
      });
    });

    it('handles network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      // Open dialog and click delete
      const deleteButton = screen.getByRole('button', { name: /delete button/i });
      fireEvent.click(deleteButton);
      
      const confirmDeleteButton = screen.getByTestId('alert-dialog-action');
      fireEvent.click(confirmDeleteButton);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to delete post');
        expect(mockOnPostDeleted).not.toHaveBeenCalled();
      });
      
      // Dialog should be closed even on error
      expect(screen.queryByTestId('alert-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    beforeEach(() => {
      (useUser as any).mockReturnValue({ user: { id: 'user-123' } });
    });

    it('applies correct CSS classes', () => {
      render(
        <DeleteButton 
          post={mockPost} 
          userUUID={userUUID} 
          onPostDeleted={mockOnPostDeleted} 
        />
      );
      
      const deleteButton = screen.getByRole('button', { name: /delete button/i });
      expect(deleteButton).toHaveClass('hover:scale-110');
      
      const icon = deleteButton.querySelector('svg');
      expect(icon).toHaveClass('hover:text-red-500');
    });
  });
});