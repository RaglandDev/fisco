import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Use vi.hoisted to ensure mockSql is available during hoisting
const mockSql = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

// Import after mocking
const { POST, DELETE } = await import("@/api/posts/route")

describe("API Route: /api/posts", () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  describe("POST /api/posts - Fetch posts by IDs", () => {
    it("should fetch posts successfully with valid IDs", async () => {
      const requestBody = {
        ids: ["post-uuid-1", "post-uuid-2", "post-uuid-3"],
      }

      const mockPostsResult = [
        {
          id: "post-uuid-1",
          s3_url: "https://example-bucket.s3.amazonaws.com/image1.jpg",
        },
        {
          id: "post-uuid-2",
          s3_url: "https://example-bucket.s3.amazonaws.com/image2.jpg",
        },
        {
          id: "post-uuid-3",
          s3_url: "https://example-bucket.s3.amazonaws.com/image3.jpg",
        },
      ]

      mockSql.mockResolvedValue(mockPostsResult)

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        posts: [
          {
            id: "post-uuid-1",
            image_url: "https://example-bucket.s3.amazonaws.com/image1.jpg",
          },
          {
            id: "post-uuid-2",
            image_url: "https://example-bucket.s3.amazonaws.com/image2.jpg",
          },
          {
            id: "post-uuid-3",
            image_url: "https://example-bucket.s3.amazonaws.com/image3.jpg",
          },
        ],
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL was called with correct parameters
      const callArguments = mockSql.mock.calls[0]
      const interpolatedValues = callArguments.slice(1)
      console.log(interpolatedValues, [requestBody.ids])
      expect(interpolatedValues).toEqual([requestBody.ids])

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS")
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization")
    })

    it("should return empty posts array when ids array is empty", async () => {
      const requestBody = {
        ids: [],
      }

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ posts: [] })
      expect(mockSql).not.toHaveBeenCalled()

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return 500 error when database query fails during fetch", async () => {
      const requestBody = {
        ids: ["post-uuid-1", "post-uuid-2"],
      }

      const dbError = new Error("Database connection failed")
      mockSql.mockRejectedValue(dbError)

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to create or fetch posts" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })
  })

  describe("POST /api/posts - Create new post", () => {
    it("should create a post successfully", async () => {
      const requestBody = {
        fk_image_id: "image-uuid-1",
        clerk_user_id: "clerk_user_456",
        tags: "nature,landscape,photography",
      }

      // Mock user lookup
      const mockUserResult = [{ id: "user-uuid-1" }]
      // Mock post creation
      const mockPostResult = [{ id: "post-uuid-new" }]

      mockSql
        .mockResolvedValueOnce(mockUserResult) // First call for user lookup
        .mockResolvedValueOnce(mockPostResult) // Second call for post creation

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ id: "post-uuid-new" })
      expect(mockSql).toHaveBeenCalledTimes(2)

      // Verify the SQL calls
      const userLookupCall = mockSql.mock.calls[0]
      const postInsertCall = mockSql.mock.calls[1]

      expect(userLookupCall.slice(1)).toContain(requestBody.clerk_user_id)
      expect(postInsertCall.slice(1)).toContain(requestBody.fk_image_id)
      expect(postInsertCall.slice(1)).toContain("user-uuid-1") // author_uuid
      expect(postInsertCall.slice(1)).toContain(requestBody.tags)

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return 400 error when fk_image_id is missing", async () => {
      const requestBody = {
        clerk_user_id: "clerk_user_456",
        tags: "nature,landscape",
        // Missing fk_image_id
      }

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing fk_image_id or clerk_user_id" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when clerk_user_id is missing", async () => {
      const requestBody = {
        fk_image_id: "image-uuid-1",
        tags: "nature,landscape",
        // Missing clerk_user_id
      }

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing fk_image_id or clerk_user_id" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when both required fields are missing", async () => {
      const requestBody = {
        tags: "nature,landscape",
        // Missing both fk_image_id and clerk_user_id
      }

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing fk_image_id or clerk_user_id" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 404 error when user is not found", async () => {
      const requestBody = {
        fk_image_id: "image-uuid-1",
        clerk_user_id: "nonexistent_user",
        tags: "nature,landscape",
      }

      // Mock empty user result
      mockSql.mockResolvedValue([])

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(404)
      expect(responseBody).toEqual({ error: "No matching user found" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 500 error when post creation fails", async () => {
      const requestBody = {
        fk_image_id: "image-uuid-1",
        clerk_user_id: "clerk_user_456",
        tags: "nature,landscape",
      }

      // Mock user lookup success, post creation failure
      const mockUserResult = [{ id: "user-uuid-1" }]
      const dbError = new Error("Insert failed")

      mockSql
        .mockResolvedValueOnce(mockUserResult) // User lookup succeeds
        .mockRejectedValueOnce(dbError) // Post creation fails

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to create or fetch posts" })
      expect(mockSql).toHaveBeenCalledTimes(2)
    })

    it("should return 500 error when database returns no postId", async () => {
      const requestBody = {
        fk_image_id: "image-uuid-1",
        clerk_user_id: "clerk_user_456",
        tags: "nature,landscape",
      }

      // Mock user lookup success, post creation returns no id
      const mockUserResult = [{ id: "user-uuid-1" }]
      const mockPostResult = [{}] // No id field

      mockSql.mockResolvedValueOnce(mockUserResult).mockResolvedValueOnce(mockPostResult)

      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to create or fetch posts" })
      expect(mockSql).toHaveBeenCalledTimes(2)
    })

    it("should handle malformed JSON in request body", async () => {
      const req = new NextRequest("http://localhost/api/posts", {
        method: "POST",
        body: "invalid json{",
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to create or fetch posts" })
      expect(mockSql).not.toHaveBeenCalled()
    })
  })

  describe("DELETE /api/posts", () => {
    it("should delete a post successfully with associated data", async () => {
      const requestBody = {
        postId: "post-uuid-1",
      }

      // Mock image lookup
      const mockImageResult = [{ fk_image_id: "image-uuid-1" }]

      mockSql
        .mockResolvedValueOnce(mockImageResult) // Image lookup
        .mockResolvedValueOnce([]) // Delete comments
        .mockResolvedValueOnce([]) // Delete post
        .mockResolvedValueOnce([]) // Delete image

      const req = new NextRequest("http://localhost/api/posts", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ success: true })
      expect(mockSql).toHaveBeenCalledTimes(4)

      // Verify the SQL calls were made in correct order
      const imageSelectCall = mockSql.mock.calls[0]
      const deleteCommentsCall = mockSql.mock.calls[1]
      const deletePostCall = mockSql.mock.calls[2]
      const deleteImageCall = mockSql.mock.calls[3]

      expect(imageSelectCall.slice(1)).toContain(requestBody.postId)
      expect(deleteCommentsCall.slice(1)).toContain(requestBody.postId)
      expect(deletePostCall.slice(1)).toContain(requestBody.postId)
      expect(deleteImageCall.slice(1)).toContain("image-uuid-1")

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return 400 error when postId is missing", async () => {
      const requestBody = {
        // Missing postId
      }

      const req = new NextRequest("http://localhost/api/posts", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing post id" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 404 error when post/image is not found", async () => {
      const requestBody = {
        postId: "nonexistent-post",
      }

      // Mock empty image result
      mockSql.mockResolvedValue([])

      const req = new NextRequest("http://localhost/api/posts", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(404)
      expect(responseBody).toEqual({ error: "No associated image found" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 500 error when database operation fails", async () => {
      const requestBody = {
        postId: "post-uuid-1",
      }

      const dbError = new Error("Delete operation failed")
      mockSql.mockRejectedValue(dbError)

      const req = new NextRequest("http://localhost/api/posts", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to delete post" })
    })

    it("should handle malformed JSON in delete request", async () => {
      const req = new NextRequest("http://localhost/api/posts", {
        method: "DELETE",
        body: "invalid json{",
        headers: { "Content-Type": "application/json" },
      })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Failed to delete post" })
      expect(mockSql).not.toHaveBeenCalled()
    })
  })
})
