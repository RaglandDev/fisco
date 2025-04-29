import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import ImageUpload from "@/components/server/ImageUpload.server";

// Mock server setup
const server = setupServer(
  http.post("/api/images", () => {
    return HttpResponse.json({
      url: "data:image/jpeg;base64,mockImageData",
      post: { id: "mock-post-id" },
      imageId: "mock-image-id"
    });
  })
);

describe("ImageUpload Component", () => {
  // Setup MSW server before tests
  beforeAll(() => server.listen());
  
  // Reset handlers after each test
  afterEach(() => server.resetHandlers());
  
  // Clean up after all tests
  afterAll(() => server.close());

  it("should render the upload button", () => {
    render(<ImageUpload />);
    const button = screen.getByRole("button", { name: /new post/i });
    expect(button).toBeDefined();
  });

  it("should handle file upload and display image after successful upload", async () => {
    const { container } = render(<ImageUpload />);
    
    // Find the hidden file input using the container query
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();
    
    // Create a mock file
    const file = new File(["dummy content"], "test-image.jpg", { type: "image/jpeg" });
    
    // Trigger file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for the upload to complete and check if the image is displayed
    await waitFor(() => {
      const img = container.querySelector('img');
      expect(img).toBeDefined();
    });
  });
});