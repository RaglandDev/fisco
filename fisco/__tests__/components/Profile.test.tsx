import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Profile from "@/components/Profile.client";
import { useAuth } from '@clerk/nextjs';

// Mock useAuth
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
}));

// Mock DropDownMenu so it doesn't interfere with rendering
vi.mock('@/components/DropDown.client', () => ({
  __esModule: true,
  default: () => <div data-testid="dropdown">Dropdown</div>,
}));

describe("Profile Component", () => {
  beforeEach(() => {
    // Set up useAuth to return a mock user
    (useAuth as any).mockReturnValue({
      userId: "123",
      isLoaded: true,
    });

    // Chain two mock fetch calls: first for user data, second for profile image
    global.fetch = vi.fn()
      // 1. fetch(`/api/userendpoint?userId=...`)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          user: {
            first_name: "John",
            last_name: "Doe",
            email: "john.doe@example.com",
            fk_image_id: "fake-id",
            image_data: null,
          },
        }),
      })
      // 2. fetch(`/api/profilephoto?user_id=...`)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          image_data: "fakebase64data",
        }),
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should render the component without errors", async () => {
    render(<Profile userId="123" isOwner={true} />);
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeDefined();
    });
  });


  // it("should render user data when fetched successfully", async () => {
  //   render(<Profile />);
  //   await waitFor(() => {
  //     const userName = screen.getByText("John Doe");
  //     expect(userName).toBeDefined();

  //     const userEmail = screen.getByText("john.doe@example.com");
  //     expect(userEmail).toBeDefined();

  //     const profileImage = screen.getByAltText("Profile");
  //     expect(profileImage).toBeDefined();
  //     expect(profileImage.getAttribute("src")).toEqual("data:image/jpeg;base64,fakebase64data");
  //   });
  // });

  it("should display loading state if not loaded yet", () => {
    (useAuth as any).mockReturnValue({
      userId: undefined,
      isLoaded: true,
    });

    render(<Profile />);
    expect(screen.getByText("Loading...")).toBeDefined();
  });
});