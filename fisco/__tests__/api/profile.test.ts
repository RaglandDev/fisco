import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Use vi.hoisted to ensure mockSql is available during hoisting
const mockSql = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

// Import after mocking
const { POST, DELETE } = await import("@/api/profile/route")

describe("API Route: /api/profile", () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  describe("POST /api/profile - Save post", () => {
    it("should save a post to user's saved posts successfully", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      // Mock existing saved posts
      const mockExistingResult = [
        {
          saved_posts: {
            "Saved Posts": ["post-uuid-2", "post-uuid-3"],
          },
        },
      ]

      mockSql
        .mockResolvedValueOnce([]) // Post update (saves field)
        .mockResolvedValueOnce(mockExistingResult) // Get existing saved_posts
        .mockResolvedValueOnce([]) // Update user saved_posts

      const req = new NextRequest("http://localhost/api/profile", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        saved_galleries: {
          "Saved Posts": ["post-uuid-2", "post-uuid-3", "post-uuid-1"],
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(3)

      // Verify the SQL calls
      const postUpdateCall = mockSql.mock.calls[0]
      const getUserCall = mockSql.mock.calls[1]
      const updateUserCall = mockSql.mock.calls[2]

      expect(postUpdateCall.slice(1)).toContain(requestBody.userId)
      expect(postUpdateCall.slice(1)).toContain(requestBody.post_id)
      expect(getUserCall.slice(1)).toContain(requestBody.userId)
      expect(updateUserCall.slice(1)).toContain(requestBody.userId)

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should save a post when user has no existing saved posts", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      // Mock user with no saved posts
      const mockExistingResult = [{ saved_posts: null }]

      mockSql
        .mockResolvedValueOnce([]) // Post update
        .mockResolvedValueOnce(mockExistingResult) // Get existing (empty)
        .mockResolvedValueOnce([]) // Update user

      const req = new NextRequest("http://localhost/api/profile", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        saved_galleries: {
          "Saved Posts": ["post-uuid-1"],
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(3)
    })

    it("should not duplicate posts when saving already saved post", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      // Mock existing saved posts that already includes the post
      const mockExistingResult = [
        {
          saved_posts: {
            "Saved Posts": ["post-uuid-1", "post-uuid-2"],
          },
        },
      ]

      mockSql
        .mockResolvedValueOnce([]) // Post update
        .mockResolvedValueOnce(mockExistingResult) // Get existing
        .mockResolvedValueOnce([]) // Update user

      const req = new NextRequest("http://localhost/api/profile", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        saved_galleries: {
          "Saved Posts": ["post-uuid-1", "post-uuid-2"],
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(3)
    })

    it("should return current saved posts when no post_id provided", async () => {
      const requestBody = {
        userId: "clerk_user_123",
        // No post_id
      }

      const mockSavedPostsResult = [
        {
          saved_posts: {
            "Saved Posts": ["post-uuid-1", "post-uuid-2"],
          },
        },
      ]

      mockSql.mockResolvedValue(mockSavedPostsResult)

      const req = new NextRequest("http://localhost/api/profile", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        saved_galleries: {
          "Saved Posts": ["post-uuid-1", "post-uuid-2"],
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return empty saved posts when user has none", async () => {
      const requestBody = {
        userId: "clerk_user_123",
      }

      const mockEmptyResult = [{ saved_posts: null }]

      mockSql.mockResolvedValue(mockEmptyResult)

      const req = new NextRequest("http://localhost/api/profile", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        saved_galleries: {
          "Saved Posts": [],
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 400 error when userId is missing", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        // Missing userId
      }

      const req = new NextRequest("http://localhost/api/profile", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing userId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 500 error when database operation fails", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      const dbError = new Error("Database connection failed")
      mockSql.mockRejectedValue(dbError)

      const req = new NextRequest("http://localhost/api/profile", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to process request" })
    })

  })

  describe("DELETE /api/profile - Remove saved post", () => {
    it("should remove a post from saved posts successfully", async () => {
      const requestBody = {
        post_id: "post-uuid-2",
        userId: "clerk_user_123",
      }

      // Mock existing saved posts
      const mockExistingResult = [
        {
          saved_posts: {
            "Saved Posts": ["post-uuid-1", "post-uuid-2", "post-uuid-3"],
          },
        },
      ]

      mockSql
        .mockResolvedValueOnce([]) // Remove from post saves
        .mockResolvedValueOnce(mockExistingResult) // Get existing saved_posts
        .mockResolvedValueOnce([]) // Update user saved_posts

      const req = new NextRequest("http://localhost/api/profile", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        saved_galleries: {
          "Saved Posts": ["post-uuid-1", "post-uuid-3"],
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(3)

      // Verify the SQL calls
      const postUpdateCall = mockSql.mock.calls[0]
      const getUserCall = mockSql.mock.calls[1]
      const updateUserCall = mockSql.mock.calls[2]

      expect(postUpdateCall.slice(1)).toContain(requestBody.userId)
      expect(postUpdateCall.slice(1)).toContain(requestBody.post_id)
      expect(getUserCall.slice(1)).toContain(requestBody.userId)
      expect(updateUserCall.slice(1)).toContain(requestBody.userId)

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should handle removing non-existent post from saved posts", async () => {
      const requestBody = {
        post_id: "non-existent-post",
        userId: "clerk_user_123",
      }

      // Mock existing saved posts that don't include the post
      const mockExistingResult = [
        {
          saved_posts: {
            "Saved Posts": ["post-uuid-1", "post-uuid-2"],
          },
        },
      ]

      mockSql
        .mockResolvedValueOnce([]) // Remove from post saves
        .mockResolvedValueOnce(mockExistingResult) // Get existing
        .mockResolvedValueOnce([]) // Update user

      const req = new NextRequest("http://localhost/api/profile", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        saved_galleries: {
          "Saved Posts": ["post-uuid-1", "post-uuid-2"],
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(3)
    })

    it("should handle user with no saved posts", async () => {
      const requestBody = {
        post_id: "post-uuid-1",
        userId: "clerk_user_123",
      }

      // Mock user with no saved posts
      const mockExistingResult = [{ saved_posts: null }]

      mockSql
        .mockResolvedValueOnce([]) // Remove from post saves
        .mockResolvedValueOnce(mockExistingResult) // Get existing (empty)
        .mockResolvedValueOnce([]) // Update user

      const req = new NextRequest("http://localhost/api/profile", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        saved_galleries: {
          "Saved Posts": [],
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(3)
    })

    it("should return 400 error when post_id is missing", async () => {
      const requestBody = {
        userId: "clerk_user_123",
        // Missing post_id
      }

      const req = new NextRequest("http://localhost/api/profile", {
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

      const req = new NextRequest("http://localhost/api/profile", {
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

      const req = new NextRequest("http://localhost/api/profile", {
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

      const dbError = new Error("Database operation failed")
      mockSql.mockRejectedValue(dbError)

      const req = new NextRequest("http://localhost/api/profile", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to unsave post" })
    })

  })
})
