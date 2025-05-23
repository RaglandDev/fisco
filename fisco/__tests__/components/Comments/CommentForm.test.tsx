import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { CommentForm } from '@/components/Comments/CommentForm';

// Mock the DrawerFooter component
vi.mock('@/components/ui/drawer', () => ({
  DrawerFooter: ({ children, className }) => (
    <div data-testid="drawer-footer" className={className}>
      {children}
    </div>
  )
}));

// Mock the Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, type, className, onClick }) => (
    <button 
      type={type} 
      disabled={disabled} 
      className={className}
      onClick={onClick}
      data-testid="submit-button"
    >
      {children}
    </button>
  )
}));

describe('CommentForm', () => {
  const onSubmitMock = vi.fn().mockResolvedValue(true);
  const onErrorMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(<CommentForm onSubmit={onSubmitMock} onError={onErrorMock} />);
    
    expect(screen.getByPlaceholderText('Leave a comment...')).toBeInTheDocument();
    expect(screen.getByText('0/200')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('updates character count when typing', () => {
    render(<CommentForm onSubmit={onSubmitMock} onError={onErrorMock} />);
    
    const input = screen.getByPlaceholderText('Leave a comment...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    
    expect(screen.getByText('11/200')).toBeInTheDocument();
  });

  it('disables submit button when comment is empty', () => {
    render(<CommentForm onSubmit={onSubmitMock} onError={onErrorMock} />);
    
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('enables submit button when comment is not empty', () => {
    render(<CommentForm onSubmit={onSubmitMock} onError={onErrorMock} />);
    
    const input = screen.getByPlaceholderText('Leave a comment...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    
    expect(screen.getByTestId('submit-button')).not.toBeDisabled();
  });

  it('submits the form and clears input on successful submission', async () => {
    render(<CommentForm onSubmit={onSubmitMock} onError={onErrorMock} />);
    
    const input = screen.getByPlaceholderText('Leave a comment...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    expect(onSubmitMock).toHaveBeenCalledWith('Hello world');
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('shows error when submission fails', async () => {
    const failedSubmitMock = vi.fn().mockResolvedValue(false);
    render(<CommentForm onSubmit={failedSubmitMock} onError={onErrorMock} />);
    
    const input = screen.getByPlaceholderText('Leave a comment...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith('Failed to post comment');
    });
  });

  it('handles submission errors', async () => {
    const errorSubmitMock = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<CommentForm onSubmit={errorSubmitMock} onError={onErrorMock} />);
    
    const input = screen.getByPlaceholderText('Leave a comment...');
    fireEvent.change(input, { target: { value: 'Hello world' } });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith('Failed to post comment');
    });
  });

  it('trims whitespace from comment before submission', async () => {
    render(<CommentForm onSubmit={onSubmitMock} onError={onErrorMock} />);
    
    const input = screen.getByPlaceholderText('Leave a comment...');

    await act( async () => {
      fireEvent.change(input, { target: { value: '  Hello world  ' } });
    });

    const submitButton = screen.getByTestId('submit-button');

    await act( async () => {      
      fireEvent.click(submitButton);
    });

    expect(onSubmitMock).toHaveBeenCalledWith('Hello world');
  });
});