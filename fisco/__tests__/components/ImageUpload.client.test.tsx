import { render, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import ImageUpload, { ImageUploadHandle } from "@/components/ImageUpload.client";
import { createRef } from "react";

// Mock server setup
const server = setupServer(
  http.post("/api/images", async () => {
    return HttpResponse.json({ id: "mock-image-id" });
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
    const mockOnUploadComplete = vi.fn();
    const mockOnUploadError = vi.fn();
    const ref = createRef<ImageUploadHandle>();
    
    const { container } = render(
      <ImageUpload 
        ref={ref}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );
    
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeDefined();
    
    const file = new File(["dummy content"], "test-image.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith("mock-image-id");
    });
    expect(mockOnUploadError).not.toHaveBeenCalled();
  });

  it("should not allow files larger than 10MB", async () => {
    const mockOnUploadComplete = vi.fn();
    const mockOnUploadError = vi.fn();
    const ref = createRef<ImageUploadHandle>();
    const { container } = render(
      <ImageUpload 
        ref={ref}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    // 11MB file
    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "big-image.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [bigFile] } });
    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith(expect.stringContaining("Maximum allowed size is 10MB"));
    });
    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });
  
  it("should handle upload errors and call onUploadError callback", async () => {
    server.use(
      http.post("/api/images", () => {
        return HttpResponse.json({ error: "Server error" }, { status: 500 });
      })
    );
    const mockOnUploadComplete = vi.fn();
    const mockOnUploadError = vi.fn();
    const ref = createRef<ImageUploadHandle>();
    const { container } = render(
      <ImageUpload 
        ref={ref}
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["dummy content"], "test-image.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith("Server error");
    });
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