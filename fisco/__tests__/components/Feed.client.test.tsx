import { render, screen, waitFor } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';
import Feed from '@/components/Feed.client'

// Mock the useRouter hook from Next.js
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),       // Mock push method
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Set up mock response handler
const handlers = [
  http.get(`${process.env.NEXT_PUBLIC_API_URL}/api/testendpoint`, (req) => {
    return new HttpResponse(
      JSON.stringify([
        { id: '1', fk_image_id: 'img-123', image_data: 'base64img', first_name: 'Test Item 1' },
        { id: '2', fk_image_id: 'img-124', image_data: 'base64img', first_name: 'Test Item 2' },
      ]),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it('renders a list of posts', async () => {
  const postData = [
    { id: '1', image_data: 'base64img', first_name: 'Test Item 1' },
    { id: '2', image_data: 'base64img', first_name: 'Test Item 2' },
  ];

  console.log(`${process.env.NEXT_PUBLIC_API_URL}`)

  render(<Feed postData={postData} offset={0} />);

  await waitFor(() => expect(screen.getAllByRole('img').length).toEqual(2));
});
