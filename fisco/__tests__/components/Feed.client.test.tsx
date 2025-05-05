import { render, screen, waitFor } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ClerkProvider } from '@clerk/nextjs';
import Feed from '@/components/Feed.client'

// Mock the useRouter and usePathname hooks from Next.js
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),       // Mock push method
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: vi.fn().mockReturnValue('/'),  // Mock usePathname with a dummy return value
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
    { id: '1', fk_image_id: 'img-123', fk_author_id: 'author-1', likes: [], image_data: 'base64img', first_name: 'Test Item 1', created_at: '2023-01-01T00:00:00Z', comments: [], last_name: 'LastName1' },
    { id: '2', fk_image_id: 'img-124', fk_author_id: 'author-2', likes: [], image_data: 'base64img', first_name: 'Test Item 2', created_at: '2023-01-02T00:00:00Z', comments: [], last_name: 'LastName2' },
  ];

  console.log(`${process.env.NEXT_PUBLIC_API_URL}`);

  render(
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}> {/* Wrap with ClerkProvider */}
      <Feed postData={postData} offset={0} />
    </ClerkProvider>
  );

  await waitFor(() => expect(screen.getAllByRole('img').length).toEqual(2));
});
