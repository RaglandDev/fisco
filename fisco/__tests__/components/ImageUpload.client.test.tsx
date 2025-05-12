import { render, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import ImageUpload, { ImageUploadHandle } from "@/components/ImageUpload.client";
import { createRef } from "react";

// Mock the FileReader API
const mockFileReaderInstance = {
  readAsDataURL: vi.fn(),
  onload: null as any,
  onerror: null as any,
  result: null as any
};

vi.stubGlobal('FileReader', vi.fn(() => mockFileReaderInstance));

// Mock server setup
const server = setupServer(
  http.post("/api/images", async () => {
    return HttpResponse.json({ id: "mock-image-id" });
  })
);

// Mock base64 encoded content
const mockBase64Content = "data:image/jpeg;base64,ZHVtbXkgY29udGVudA==";

describe("ImageUpload Component", () => {
  // Setup MSW server before tests
  beforeAll(() => server.listen());
  
  // Reset handlers after each test
  afterEach(() => server.resetHandlers());
  
  // Clean up after all tests
  afterAll(() => server.close());

  // No need to test basic rendering for shadcn components

  it("handles file upload and calls onUploadComplete with data URL", async () => {
    const mockOnUploadComplete = vi.fn();
    const mockOnUploadError = vi.fn();
    const { container } = render(
      <ImageUpload 
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );
    
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["dummy content"], "test-image.jpg", { type: "image/jpeg" });
    
    // Trigger file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Simulate FileReader onload event
    mockFileReaderInstance.result = mockBase64Content;
    mockFileReaderInstance.onload && mockFileReaderInstance.onload({} as any);
    
    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith(mockBase64Content);
    });
    expect(mockOnUploadError).not.toHaveBeenCalled();
  });

  it("rejects files larger than size limit", async () => {
    const mockOnUploadComplete = vi.fn();
    const mockOnUploadError = vi.fn();
    const { container } = render(
      <ImageUpload 
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );
    
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    // 11MB file
    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "big-image.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput, { target: { files: [bigFile] } });
    
    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalled();
    });
    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });
  
  it("handles FileReader errors", async () => {
    const mockOnUploadComplete = vi.fn();
    const mockOnUploadError = vi.fn();
    const { container } = render(
      <ImageUpload 
        onUploadComplete={mockOnUploadComplete}
        onUploadError={mockOnUploadError}
      />
    );
    
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["dummy content"], "test-image.jpg", { type: "image/jpeg" });
    
    // Trigger file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Simulate FileReader onerror event
    mockFileReaderInstance.onerror && mockFileReaderInstance.onerror({} as any);
    
    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalled();
    });
    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  });
  
  it("exposes triggerFileSelect via ref", () => {
    const originalClick = HTMLInputElement.prototype.click;
    const mockClick = vi.fn();
    HTMLInputElement.prototype.click = mockClick;
    
    const ref = createRef<ImageUploadHandle>();
    render(<ImageUpload ref={ref} />);
    
    ref.current?.triggerFileSelect();
    expect(mockClick).toHaveBeenCalledTimes(1);
    
    // Restore original implementation
    HTMLInputElement.prototype.click = originalClick;
  });
  

});