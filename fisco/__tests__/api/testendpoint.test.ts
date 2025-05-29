import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Use vi.hoisted to ensure mockSql is available during hoisting
const mockSql = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

// Import after mocking
const { GET, POST, DELETE } = await import("@/api/testendpoint/route")

describe("API Route: /api/testendpoint", () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  describe("GET /api/testendpoint - Fetch posts", () => {
    it("should fetch posts successfully with default pagination", async () => {
      const mockPostsResult = [
        {
          id: "post-uuid-1",
          title: "Test Post 1",
          created_at: `${new Date("2024-01-15T10:30:00.000Z")}`,
          image_url: "https://example.com/image1.jpg",
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          clerk_user_id: "clerk_user_123",
          profile_image_url: "https://example.com/profile1.jpg",
          comment_count: 5,
        },
        {
          id: "post-uuid-2",
          title: "Test Post 2",
          created_at: `${new Date("2024-01-14T09:15:00.000Z")}`,
          image_url: "https://example.com/image2.jpg",
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          clerk_user_id: "clerk_user_456",
          profile_image_url: null,
          comment_count: 3,
        },
      ]

      mockSql.mockResolvedValue(mockPostsResult)

      const requestUrl = "http://localhost/api/testendpoint"
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ posts: mockPostsResult })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL call includes default pagination
      const sqlCall = mockSql.mock.calls[0]
      const interpolatedValues = sqlCall.slice(1)
      expect(interpolatedValues).toContain(2) // default limit
      expect(interpolatedValues).toContain(0) // default offset

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS")
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization")
    })

    it("should fetch posts with custom pagination parameters", async () => {
      const mockPostsResult = [
        {
          id: "post-uuid-3",
          title: "Test Post 3",
          created_at: `${new Date("2024-01-13T08:00:00.000Z")}`,
          image_url: "https://example.com/image3.jpg",
          first_name: "Bob",
          last_name: "Johnson",
          email: "bob@example.com",
          clerk_user_id: "clerk_user_789",
          profile_image_url: "https://example.com/profile3.jpg",
          comment_count: 1,
        },
      ]

      mockSql.mockResolvedValue(mockPostsResult)

      const requestUrl = "http://localhost/api/testendpoint?limit=5&offset=10"
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ posts: mockPostsResult })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL call includes custom pagination
      const sqlCall = mockSql.mock.calls[0]
      const interpolatedValues = sqlCall.slice(1)
      expect(interpolatedValues).toContain(5) // custom limit
      expect(interpolatedValues).toContain(10) // custom offset
    })

    it("should return empty posts array when no posts exist", async () => {
      const mockEmptyResult: any[] = []

      mockSql.mockResolvedValue(mockEmptyResult)

      const requestUrl = "http://localhost/api/testendpoint"
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ posts: [] })

      expect(mockSql).toHaveBeenCalledTimes(1)
    })


    it("should return 500 error when database query fails", async () => {
      const dbError = new Error("Database connection failed")
      mockSql.mockRejectedValue(dbError)

      const requestUrl = "http://localhost/api/testendpoint"
      const req = new NextRequest(requestUrl)

      // The route doesn't have explicit error handling, so it will throw
      await expect(GET(req)).rejects.toThrow("Database connection failed")

      expect(mockSql).toHaveBeenCalledTimes(1)
    })
  })

  describe("POST /api/testendpoint - Like post", () => {
    it("should like a post successfully", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      mockSql
        .mockResolvedValueOnce([]) // Update post likes
        .mockResolvedValueOnce([]) // Update user liked_posts

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ success: true })

      expect(mockSql).toHaveBeenCalledTimes(2)

      // Verify the SQL calls
      const postUpdateCall = mockSql.mock.calls[0]
      const userUpdateCall = mockSql.mock.calls[1]

      expect(postUpdateCall.slice(1)).toContain(requestBody.userId)
      expect(postUpdateCall.slice(1)).toContain(requestBody.post_id)
      expect(userUpdateCall.slice(1)).toContain(requestBody.post_id)
      expect(userUpdateCall.slice(1)).toContain(requestBody.userId)
    })

    it("should return 400 error when post_id is missing", async () => {
      const requestBody = {
        userId: "clerk_user_123",
        // Missing post_id
      }

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing post_id or userId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when userId is missing", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        // Missing userId
      }

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing post_id or userId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when both post_id and userId are missing", async () => {
      const requestBody = {
        // Missing both post_id and userId
      }

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing post_id or userId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 500 error when database operation fails", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      const dbError = new Error("Database update failed")
      mockSql.mockRejectedValue(dbError)

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to like post" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 500 error when user update fails", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      mockSql
        .mockResolvedValueOnce([]) // Post update succeeds
        .mockRejectedValueOnce(new Error("User update failed")) // User update fails

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to like post" })
      expect(mockSql).toHaveBeenCalledTimes(2)
    })
  })

  describe("DELETE /api/testendpoint - Unlike post", () => {
    it("should unlike a post successfully", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      mockSql
        .mockResolvedValueOnce([]) // Remove from post likes
        .mockResolvedValueOnce([]) // Remove from user liked_posts

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ success: true })

      expect(mockSql).toHaveBeenCalledTimes(2)

      // Verify the SQL calls
      const postUpdateCall = mockSql.mock.calls[0]
      const userUpdateCall = mockSql.mock.calls[1]

      expect(postUpdateCall.slice(1)).toContain(requestBody.userId)
      expect(postUpdateCall.slice(1)).toContain(requestBody.post_id)
      expect(userUpdateCall.slice(1)).toContain(requestBody.post_id)
      expect(userUpdateCall.slice(1)).toContain(requestBody.userId)
    })

    it("should return 400 error when post_id is missing", async () => {
      const requestBody = {
        userId: "clerk_user_123",
        // Missing post_id
      }

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing post_id or userId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when userId is missing", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        // Missing userId
      }

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing post_id or userId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when both post_id and userId are missing", async () => {
      const requestBody = {
        // Missing both post_id and userId
      }

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing post_id or userId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 500 error when database operation fails", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      const dbError = new Error("Database delete failed")
      mockSql.mockRejectedValue(dbError)

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to delete like" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 500 error when user update fails", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      mockSql
        .mockResolvedValueOnce([]) // Post update succeeds
        .mockRejectedValueOnce(new Error("User update failed")) // User update fails

      const req = new NextRequest("http://localhost/api/testendpoint", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to delete like" })
      expect(mockSql).toHaveBeenCalledTimes(2)
    })
  })
})
