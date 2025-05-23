import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentList } from '@/components/Comments/CommentList';
import { type Comment } from '@/types/index';

// Mock the CommentItem component
vi.mock('@/components/Comments/CommentItem', () => ({
  default: ({ commentData, isOwner, onDelete }) => (
    <div data-testid="comment-item">
      <span>Comment: {commentData.comment_text}</span>
      <span>Is Owner: {String(isOwner)}</span>
      <button onClick={() => onDelete()}>Delete</button>
    </div>
  )
}));

describe('CommentList', () => {
  const mockComments: Comment[] = [
    {
      id: '1',
      user_id: '123',
      post_id: '456',
      comment_text: 'First comment',
      created_at: '2023-05-15T10:30:00Z'
    },
    {
      id: '2',
      user_id: '789',
      post_id: '456',
      comment_text: 'Second comment',
      created_at: '2023-05-15T11:30:00Z'
    }
  ];

  const onDeleteCommentMock = vi.fn();

  it('shows loading state when isLoading is true', () => {
    render(
      <CommentList 
        comments={[]} 
        isLoading={true} 
        internalUserId="123" 
        onDeleteComment={onDeleteCommentMock} 
      />
    );
    
    expect(screen.getByText('Loading comments...')).toBeInTheDocument();
  });

  it('shows empty state when no comments are available', () => {
    render(
      <CommentList 
        comments={[]} 
        isLoading={false} 
        internalUserId="123" 
        onDeleteComment={onDeleteCommentMock} 
      />
    );
    
    expect(screen.getByText('No comments yet.')).toBeInTheDocument();
    expect(screen.getByText('Be the first to comment!')).toBeInTheDocument();
  });

  it('renders a list of comments when available', () => {
    render(
      <CommentList 
        comments={mockComments} 
        isLoading={false} 
        internalUserId="123" 
        onDeleteComment={onDeleteCommentMock} 
      />
    );
    
    const commentItems = screen.getAllByTestId('comment-item');
    expect(commentItems).toHaveLength(2);
  });

  it('passes correct isOwner prop to CommentItem', () => {
    render(
      <CommentList 
        comments={mockComments} 
        isLoading={false} 
        internalUserId="123" 
        onDeleteComment={onDeleteCommentMock} 
      />
    );
    
    // First comment should have isOwner=true (user_id matches internalUserId)
    expect(screen.getAllByText('Is Owner: true')).toHaveLength(1);
    
    // Second comment should have isOwner=false
    expect(screen.getAllByText('Is Owner: false')).toHaveLength(1);
  });
});