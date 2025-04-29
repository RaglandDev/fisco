import { render, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import ImageUpload, { ImageUploadHandle } from "@/components/ImageUpload.client";
import { createRef } from "react";

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

  it("should render the component without errors", () => {
    const { container } = render(<ImageUpload />);
    expect(container).toBeDefined();
  });

  it("should handle file upload and call onUploadComplete callback", async () => {
    // Create a mock callback function
    const mockOnUploadComplete = vi.fn();
    const mockOnUploadError = vi.fn();
    const ref = createRef<ImageUploadHandle>();
    
    // Render the component with the mock callback
    const { container } = render(
      <ImageUpload 
        ref={ref}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );
    
    // Find the hidden file input
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();
    
    // Create a mock file
    const file = new File(["dummy content"], "test-image.jpg", { type: "image/jpeg" });
    
    // Trigger file selection through the ref
    expect(ref.current).toBeDefined();
    
    // Manually trigger file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for the upload to complete and check if the callback was called
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith("data:image/jpeg;base64,mockImageData");
    });
    
    // Make sure error callback was not called
    expect(mockOnUploadError).not.toHaveBeenCalled();
  });
  
  it("should handle upload errors and call onUploadError callback", async () => {
    // Override the default handler for this test
    server.use(
      http.post("/api/images", () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      })
    );
    
    // Create mock callbacks
    const mockOnUploadComplete = vi.fn();
    const mockOnUploadError = vi.fn();
    const ref = createRef<ImageUploadHandle>();
    
    // Render the component with the mock callbacks
    const { container } = render(
      <ImageUpload 
        ref={ref}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );
    
    // Find the hidden file input
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();
    
    // Create a mock file
    const file = new File(["dummy content"], "test-image.jpg", { type: "image/jpeg" });
    
    // Trigger file upload
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Wait for the error callback to be called
    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalled();
    });
    
    // Make sure success callback was not called
    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });
  
  it("should expose triggerFileSelect method via ref", () => {
    // Create a ref
    const ref = createRef<ImageUploadHandle>();
    
    // Mock the click method
    const mockClick = vi.fn();
    HTMLInputElement.prototype.click = mockClick;
    
    // Render the component with the ref
    render(<ImageUpload ref={ref} />);
    
    // Call the triggerFileSelect method
    expect(ref.current).toBeDefined();
    ref.current?.triggerFileSelect();
    
    // Verify that click was called
    expect(mockClick).toHaveBeenCalledTimes(1);
  });
});