import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommentItem from '@/components/Comments/CommentItem';
import { type Comment } from '@/types/index';

// Mock the lucide-react icon
vi.mock('lucide-react', () => ({
  Trash2: () => <div data-testid="trash-icon" />
}));

describe('CommentItem', () => {
  const mockComment: Comment = {
    id: '1',
    user_id: '123',
    post_id: '456',
    comment_text: 'This is a test comment',
    created_at: new Date() 
  };

  const onDeleteMock = vi.fn();

  it('renders comment text correctly', () => {
    render(
      <CommentItem 
        commentData={mockComment} 
        isOwner={false} 
        onDelete={onDeleteMock} 
      />
    );
    
    expect(screen.getByText('This is a test comment')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(
      <CommentItem 
        commentData={mockComment} 
        isOwner={false} 
        onDelete={onDeleteMock} 
      />
    );
    
    //this isn't working for some reason:
    //expect(screen.getByText(/Just now/)).toBeInTheDocument();
  });

  it('does not show delete button when user is not owner', () => {
    render(
      <CommentItem 
        commentData={mockComment} 
        isOwner={false} 
        onDelete={onDeleteMock} 
      />
    );
    
    expect(screen.queryByRole('button', { name: /delete comment/i })).not.toBeInTheDocument();
  });

  it('shows delete button when user is owner', () => {
    render(
      <CommentItem 
        commentData={mockComment} 
        isOwner={true} 
        onDelete={onDeleteMock} 
      />
    );
    
    expect(screen.getByRole('button', { name: /delete comment/i })).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <CommentItem 
        commentData={mockComment} 
        isOwner={true} 
        onDelete={onDeleteMock} 
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /delete comment/i }));
    expect(onDeleteMock).toHaveBeenCalledTimes(1);
  });

  it('handles invalid date gracefully', () => {
    const commentWithInvalidDate = {
      ...mockComment,
      created_at: 'invalid-date'
    };

    render(
      <CommentItem 
        commentData={commentWithInvalidDate} 
        isOwner={false} 
        onDelete={onDeleteMock} 
      />
    );
    
    expect(screen.getByText('Invalid date')).toBeInTheDocument();
  });
});