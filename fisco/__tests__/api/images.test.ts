import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { POST } from '@/api/images/route';

// Mock the database functions
vi.mock('@/lib/db', () => ({
  storeImage: vi.fn().mockResolvedValue({ id: 'mock-image-id' }),
  createPost: vi.fn().mockResolvedValue({ id: 'mock-post-id' })
}));

describe('Images API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully process valid image upload', async () => {
    // Create mock Form Data with properly mocked file
    const mockFormData = {
      get: vi.fn().mockReturnValue({
        type: 'image/jpeg',
        size: 1024, // Less than 10MB
        arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
      })
    };
    
    // Setup mock request that returns our mocked FormData
    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as unknown as Request;
    
    // Call the API route with our mock request
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty('url');
    expect(responseData).toHaveProperty('imageId', 'mock-image-id');
  });

  it('should reject requests without a file', async () => {
    // Create mock Form Data that returns null for file
    const mockFormData = {
      get: vi.fn().mockReturnValue(null)
    };
    
    // Setup mock request
    const mockRequest = {
      formData: vi.fn().mockResolvedValue(mockFormData)
    } as unknown as Request;
    
    const response = await POST(mockRequest);
    const responseData = await response.json();
    
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error', 'No file provided');
  });
});
