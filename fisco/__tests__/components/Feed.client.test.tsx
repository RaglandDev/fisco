import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event'

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
  render(
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <Feed postData={postData} offset={0}/>
    </ClerkProvider>
    )
});

it('click upload button', async () => {
  const postData = [
    { id: '1', fk_image_id: 'img-123', fk_author_id: 'author-1', likes: [], image_data: 'base64img', first_name: 'Test Item 1', created_at: '2023-01-01T00:00:00Z', comments: [], last_name: 'LastName1' },
    { id: '2', fk_image_id: 'img-124', fk_author_id: 'author-2', likes: [], image_data: 'base64img', first_name: 'Test Item 2', created_at: '2023-01-02T00:00:00Z', comments: [], last_name: 'LastName2' },
  ];

  render(
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <Feed postData={postData} offset={0}/>
    </ClerkProvider>
    )

  const user = userEvent.setup()
  await user.click(screen.getByLabelText('Upload button'))
  await waitFor(async () => {
      return
      // example
    });
});

it('click like button', async () => {
  const postData = [
    { id: '1', fk_image_id: 'img-123', fk_author_id: 'author-1', likes: [], image_data: 'base64img', first_name: 'Test Item 1', created_at: '2023-01-01T00:00:00Z', comments: [], last_name: 'LastName1' },
    { id: '2', fk_image_id: 'img-124', fk_author_id: 'author-2', likes: [], image_data: 'base64img', first_name: 'Test Item 2', created_at: '2023-01-02T00:00:00Z', comments: [], last_name: 'LastName2' },
  ];

  render(
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <Feed postData={postData} offset={0}/>
    </ClerkProvider>
    )

  const user = userEvent.setup()
  await user.click(screen.getAllByLabelText('Like button')[0])
  await waitFor(async () => {
      return
      // example
    });
});

it('click comment button', async () => {
  const postData = [
    { id: '1', fk_image_id: 'img-123', fk_author_id: 'author-1', likes: [], image_data: 'base64img', first_name: 'Test Item 1', created_at: '2023-01-01T00:00:00Z', comments: [], last_name: 'LastName1' },
    { id: '2', fk_image_id: 'img-124', fk_author_id: 'author-2', likes: [], image_data: 'base64img', first_name: 'Test Item 2', created_at: '2023-01-02T00:00:00Z', comments: [], last_name: 'LastName2' },
  ];

  render(
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <Feed postData={postData} offset={0}/>
    </ClerkProvider>
    )

  const user = userEvent.setup()
  await user.click(screen.getAllByLabelText('Comment button')[0])
  await waitFor(async () => {
      return
      // example
    });
});

it('scroll feed', async () => {
    const postData = [
    { id: '1', fk_image_id: 'img-123', fk_author_id: 'author-1', likes: [], image_data: 'base64img', first_name: 'Test Item 1', created_at: '2023-01-01T00:00:00Z', comments: [], last_name: 'LastName1' },
    { id: '2', fk_image_id: 'img-124', fk_author_id: 'author-2', likes: [], image_data: 'base64img', first_name: 'Test Item 2', created_at: '2023-01-02T00:00:00Z', comments: [], last_name: 'LastName2' },
  ];

  render(
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <Feed postData={postData} offset={0}/>
    </ClerkProvider>
    )

    const feedContainer = screen.getByLabelText('Feed window');

   // Scroll down by 500px
    fireEvent.scroll(feedContainer, { target: { scrollY: 500, scrollTop: 500 } });

    await waitFor(() => {
      expect(feedContainer.scrollTop).toBe(500);
    }); 
});

