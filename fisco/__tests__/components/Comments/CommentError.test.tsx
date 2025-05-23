import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CommentError } from '@/components/Comments/CommentError';

describe('CommentError', () => {
  it('renders nothing when error is null', () => {
    const { container } = render(<CommentError error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders error message when error is provided', () => {
    const errorMessage = 'Failed to load comments';
    render(<CommentError error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});