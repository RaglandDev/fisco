import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import CommentDrawer from '@/components/Comments/CommentDrawer';
import { type Comment } from '@/types/index';

// Mock the dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({
    isSignedIn: true,
    isLoaded: true,
    userId: 'clerk-user-123'
  })
}));

vi.mock('@/lib/fetch/client/GET', () => ({
  getInternalUserId: vi.fn().mockResolvedValue('internal-user-123'),
  getComments: vi.fn().mockResolvedValue([
    {
      id: '1',
      user_id: 'internal-user-123',
      post_id: 'post-123',
      comment_text: 'Test comment 1',
      created_at: '2023-05-15T10:30:00Z'
    },
    {
      id: '2',
      user_id: 'other-user-456',
      post_id: 'post-123',
      comment_text: 'Test comment 2',
      created_at: '2023-05-15T11:30:00Z'
    }
  ])
}));

vi.mock('@/lib/fetch/client/DELETE', () => ({
  deleteComment: vi.fn().mockResolvedValue(true)
}));

vi.mock('@/lib/fetch/client/POST', () => ({
  postComment: vi.fn().mockResolvedValue(true)
}));

// Mock the UI components
vi.mock('@/components/ui/drawer', () => ({
  Drawer: ({ children, open, onOpenChange }) => (
    <div data-testid="drawer" data-open={open}>
      {open && children}
    </div>
  ),
  DrawerContent: ({ children }) => <div data-testid="drawer-content">{children}</div>,
  DrawerHeader: ({ children }) => <div data-testid="drawer-header">{children}</div>,
  DrawerTitle: ({ children }) => <div data-testid="drawer-title">{children}</div>,
  DrawerFooter: ({ children, className }) => (
    <div data-testid="drawer-footer" className={className}>
      {children}
    </div>
  )
}));

// Mock the comment components
vi.mock('@/components/Comments/CommentList', () => ({
  CommentList: ({ comments, isLoading, internalUserId, onDeleteComment }) => (
    <div data-testid="comment-list">
      <div>Loading: {String(isLoading)}</div>
      <div>Comments: {comments.length}</div>
      <div>Internal User ID: {internalUserId}</div>
      <button onClick={() => onDeleteComment('1')}>Delete Comment 1</button>
    </div>
  )
}));

vi.mock('@/components/Comments/CommentForm', () => ({
  CommentForm: ({ onSubmit, onError }) => (
    <div data-testid="comment-form">
      <button onClick={() => onSubmit('New comment')}>Submit Comment</button>
      <button onClick={() => onError('Test error')}>Trigger Error</button>
    </div>
  )
}));

vi.mock('@/components/Comments/CommentError', () => ({
  CommentError: ({ error }) => (
    error ? <div data-testid="comment-error">{error}</div> : null
  )
}));

describe('CommentDrawer', async () => {
  const mockProps = {
    open: true,
    onOpenChange: vi.fn(),
    postId: 'post-123',
    onCommentChanged: vi.fn(),
    setCommentCount: vi.fn()
  };

  const getComments = vi.mocked(await import('@/lib/fetch/client/GET')).getComments;
  const deleteComment = vi.mocked(await import('@/lib/fetch/client/DELETE')).deleteComment;
  const postComment = vi.mocked(await import('@/lib/fetch/client/POST')).postComment;

  beforeEach(() => {
    vi.clearAllMocks();
    global.confirm = vi.fn().mockReturnValue(true); // Mock confirm dialog
  });

  it('renders the drawer when open is true', async () => {
    await act( async () => {      
      render(<CommentDrawer {...mockProps} />);
    });
    
    expect(screen.getByTestId('drawer')).toHaveAttribute('data-open', 'true');
    expect(screen.getByTestId('drawer-title')).toHaveTextContent('Comments');
  });

  it('fetches comments when opened', async () => {
    render(<CommentDrawer {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Comments: 2')).toBeInTheDocument();
    });
    
    expect(mockProps.setCommentCount).toHaveBeenCalledWith(2);
  });

  it('handles comment submission', async () => {
    render(<CommentDrawer {...mockProps} />);
    
    const submitButton = screen.getByText('Submit Comment');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(postComment).toHaveBeenCalledWith({
        postId: 'post-123',
        clerkUserId: 'clerk-user-123',
        commentText: 'New comment'
      });
    });
    
    expect(mockProps.onCommentChanged).toHaveBeenCalled();
    expect(getComments).toHaveBeenCalledTimes(2); // Initial load + after submission
  });

  it('handles comment deletion', async () => {
    render(<CommentDrawer {...mockProps} />);
    
    const deleteButton = screen.getByText('Delete Comment 1');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(deleteComment).toHaveBeenCalledWith('1', 'clerk-user-123');
    });
    
    expect(getComments).toHaveBeenCalledTimes(2); // Initial load + after deletion
  });

  it('displays error message when comment fetch fails', async () => {
    getComments.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    render(<CommentDrawer {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('comment-error')).toHaveTextContent('Failed to load comments');
    });
  });

  it('handles error when deleting comment fails', async () => {
    deleteComment.mockResolvedValueOnce(false);
    
    render(<CommentDrawer {...mockProps} />);
    
    const deleteButton = screen.getByText('Delete Comment 1');
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('comment-error')).toHaveTextContent('Failed to delete comment');
    });
  });

  it('resets error when drawer closes', async () => {
    // First render with error
    getComments.mockRejectedValueOnce(new Error('Failed to fetch'));
    
    const { rerender } = render(<CommentDrawer {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('comment-error')).toBeInTheDocument();
    });
    
    // Then close the drawer
    rerender(<CommentDrawer {...mockProps} open={false} />);
    
    // Then open it again
    getComments.mockResolvedValueOnce([]);
    rerender(<CommentDrawer {...mockProps} open={true} />);
    
    await waitFor(() => {
      expect(screen.queryByTestId('comment-error')).not.toBeInTheDocument();
    });
  });
});