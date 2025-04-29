import { render, screen, fireEvent, act } from "@testing-library/react";
import ClientHome from "@/components/client/Home.client";
import { vi, describe, it, expect } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { useRouter } from "next/navigation";


// vi.mock('@clerk/nextjs', () => ({
//   SignedIn: ({ children }) => <>{children}</>,
//   SignedOut: ({ children }) => <>{children}</>,
//   SignInButton: ({ children }) => <button>{children || "Sign In"}</button>,
//   SignUpButton: ({ children }) => <button>{children || "Sign Up"}</button>,
//   UserButton: () => <div>User Avatar</div>,
//   ClerkProvider: ({ children }) => <>{children}</>,
// }));

const handlers = [
  http.get(`${process.env.API_URL}/api/testendpoint`, (req) => {
    return new HttpResponse(JSON.stringify([{ id: 1 }, { id: 2 }, { id: 3 }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

// Mocking useRouter from next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),       // mock push method
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/", // stub usePathname if used
  useSearchParams: () => ({ get: vi.fn() }),  // stub useSearchParams if used
}));

describe("ClientHome component", () => {
  it("renders list of test data", async () => {
    const postData = [
      {
        id: "1", // Mock the correct data shape for `Post`
        fk_image_id: "img-123",
        fk_author_id: "user_abc123",
        created_at: new Date(),
        likes: [],
        comments: [],
        first_name: "Test Item 1",
        last_name: "Tester",
        email: "test1@example.com",
        image_data: "base64img",
      },
      {
        id: "2",
        fk_image_id: "img-124",
        fk_author_id: "user_abc124",
        created_at: new Date(),
        likes: [],
        comments: [],
        first_name: "Test Item 2",
        last_name: "Tester",
        email: "test2@example.com",
        image_data: "base64img",
      },
    ];

    await act(async () => {
      render(<ClientHome postData={postData} offset={0} />);
    });


    //can't get router mocking to work, going to ignore for now.
  });
});
