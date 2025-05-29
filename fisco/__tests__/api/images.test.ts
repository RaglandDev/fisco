import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Use vi.hoisted to ensure mockSql is available during hoisting
const mockSql = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

// Import after mocking
const { POST, OPTIONS } = await import("@/api/images/route")

describe("API Route: /api/images", () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  describe("POST /api/images", () => {
    it("should upload image metadata successfully", async () => {
      const requestBody = {
        key: "test-images/image-123.jpg",
        url: "https://example-bucket.s3.amazonaws.com/test-images/image-123.jpg",
      }

      const mockInsertResult = [
        {
          id: "image-uuid-1",
        },
      ]

      mockSql.mockResolvedValue(mockInsertResult)

      const req = new NextRequest("http://localhost/api/images", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ id: "image-uuid-1" })
      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL was called with correct parameters
      const callArguments = mockSql.mock.calls[0]
      const interpolatedValues = callArguments.slice(1)
      expect(interpolatedValues).toContain(requestBody.key)
      expect(interpolatedValues).toContain(requestBody.url)

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS")
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization")
    })

    it("should return 400 error when key is missing", async () => {
      const requestBody = {
        url: "https://example-bucket.s3.amazonaws.com/test-images/image-123.jpg",
        // Missing key
      }

      const req = new NextRequest("http://localhost/api/images", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing key or url" })
      expect(mockSql).not.toHaveBeenCalled()

      // Check CORS headers are still present on error
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return 400 error when url is missing", async () => {
      const requestBody = {
        key: "test-images/image-123.jpg",
        // Missing url
      }

      const req = new NextRequest("http://localhost/api/images", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing key or url" })
      expect(mockSql).not.toHaveBeenCalled()

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return 400 error when both key and url are missing", async () => {
      const requestBody = {}

      const req = new NextRequest("http://localhost/api/images", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing key or url" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 500 error when database insert fails", async () => {
      const requestBody = {
        key: "test-images/image-123.jpg",
        url: "https://example-bucket.s3.amazonaws.com/test-images/image-123.jpg",
      }

      const dbError = new Error("Database insert failed")
      mockSql.mockRejectedValue(dbError)

      const req = new NextRequest("http://localhost/api/images", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to upload image" })
      expect(mockSql).toHaveBeenCalledTimes(1)

      // Check CORS headers are present on error
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return 500 error when database returns no id", async () => {
      const requestBody = {
        key: "test-images/image-123.jpg",
        url: "https://example-bucket.s3.amazonaws.com/test-images/image-123.jpg",
      }

      // Mock database returning empty result or result without id
      const mockInsertResult = [{}] // No id field
      mockSql.mockResolvedValue(mockInsertResult)

      const req = new NextRequest("http://localhost/api/images", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to upload image" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 500 error when database returns empty array", async () => {
      const requestBody = {
        key: "test-images/image-123.jpg",
        url: "https://example-bucket.s3.amazonaws.com/test-images/image-123.jpg",
      }

      // Mock database returning empty array
      const mockInsertResult: any[] = []
      mockSql.mockResolvedValue(mockInsertResult)

      const req = new NextRequest("http://localhost/api/images", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to upload image" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle malformed JSON in request body", async () => {
      const req = new NextRequest("http://localhost/api/images", {
        method: "POST",
        body: "invalid json{",
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to upload image" })
      expect(mockSql).not.toHaveBeenCalled()
    })
  })

})
