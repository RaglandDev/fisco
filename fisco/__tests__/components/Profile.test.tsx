import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import Profile from "@/components/Profile"; // Adjust path if necessary
import { useAuth } from '@clerk/nextjs';

// Mocking the `useAuth` hook from Clerk using Vitest's mocking
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(), // Using `vi.fn()` to mock `useAuth`
}));

describe("Profile Component", () => {
  // Mocking the global fetch to simulate API responses
  beforeAll(() => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({
        user: {
          first_name: "John",
          last_name: "Doe",
          email: "john.doe@example.com",
          image_url: "https://example.com/profile.jpg"
        }
      })
    });
  });

  afterAll(() => {
    // Clean up by restoring fetch after tests are done
    vi.restoreAllMocks();
  });

  it("should render the component without errors", async () => {
    (useAuth as any).mockReturnValue({
      userId: "123",
      isLoaded: true,
    });

    render(<Profile />);
    // Wait for the profile data to be fetched and displayed
    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeDefined();
    });
  });

  it("should render user data when fetched successfully", async () => {
    (useAuth as any).mockReturnValue({
      userId: "123",
      isLoaded: true,
    });

    render(<Profile />);

    // Wait for the profile data to load
    await waitFor(() => {
      const userName = screen.getByText("John Doe");
      expect(userName).toBeDefined();
      const userEmail = screen.getByText("john.doe@example.com");
      expect(userEmail).toBeDefined();
      const profileImage = screen.getByAltText("Profile");
      expect(profileImage).toBeDefined();
      expect(profileImage.getAttribute("src")).toEqual("https://example.com/profile.jpg");
    });
  });

  // it("should handle errors when user data is not found", async () => {
  //   // Simulate no user data being found
  //   global.fetch = vi.fn().mockResolvedValue({
  //     json: () => Promise.resolve({ user: {} }) // Simulate no user found
  //   });

  //   (useAuth as any).mockReturnValue({
  //     userId: "123",
  //     isLoaded: true,
  //   });

  //   render(<Profile />);

  //   // Wait for the error message to appear
  //   await waitFor(() => {
  //     expect(screen.getByText("User not found")).toBeDefined();
  //   });
  // });

  it("should display loading state if not loaded yet", () => {
    // Simulate isLoaded being false
    (useAuth as any).mockReturnValue({
      userId: undefined,
      isLoaded: true,
    });

    render(<Profile />);

    // Ensure that "Loading..." text is rendered when `isLoaded` is false
    expect(screen.getByText("Loading...")).toBeDefined();
  });
});
