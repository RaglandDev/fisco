import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Use vi.hoisted to ensure mockSql is available during hoisting
const mockSql = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

// Import after mocking
const { GET, POST, DELETE } = await import("@/api/comments/route")

describe("API Route: /api/comments", () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  describe("GET /api/comments", () => {
    it("should return comments successfully for a given postId", async () => {
      const postId = "test-post-123"
      const mockDbComments = [
        {
          id: "comment-uuid-1",
          comment_text: "This is the first comment!",
          created_at: new Date("2024-01-15T10:30:00.000Z"),
          user_id: "user-uuid-1",
          first_name: "Alice",
          last_name: "Wonderland",
        },
        {
          id: "comment-uuid-2",
          comment_text: "A second insightful comment.",
          created_at: new Date("2024-01-15T11:00:00.000Z"),
          user_id: "user-uuid-2",
          first_name: "Bob",
          last_name: "The Builder",
        },
        {
          id: "comment-uuid-3",
          comment_text: "An anonymous comment.",
          created_at: null,
          user_id: null,
          first_name: null,
          last_name: null,
        },
      ]

      mockSql.mockResolvedValue(mockDbComments)

      const requestUrl = `http://localhost/api/comments?postId=${postId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual([
        {
          id: "comment-uuid-1",
          comment_text: "This is the first comment!",
          created_at: "2024-01-15T10:30:00.000Z",
          user_id: "user-uuid-1",
          first_name: "Alice",
          last_name: "Wonderland",
        },
        {
          id: "comment-uuid-2",
          comment_text: "A second insightful comment.",
          created_at: "2024-01-15T11:00:00.000Z",
          user_id: "user-uuid-2",
          first_name: "Bob",
          last_name: "The Builder",
        },
        {
          id: "comment-uuid-3",
          comment_text: "An anonymous comment.",
          created_at: "",
          user_id: "",
          first_name: "Anonymous",
          last_name: "",
        },
      ])

      expect(mockSql).toHaveBeenCalledTimes(1)
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return 400 error when postId is missing", async () => {
      const requestUrl = "http://localhost/api/comments"
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing postId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 500 error when database query fails", async () => {
      const postId = "test-post-123"
      const dbError = new Error("Database connection failed")

      mockSql.mockRejectedValue(dbError)

      const requestUrl = `http://localhost/api/comments?postId=${postId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({
        error: "DB error",
        detail: "Error: Database connection failed",
      })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })
  })

  describe("POST /api/comments", () => {
    it("should create a comment successfully", async () => {
      const requestBody = {
        postId: "test-post-123",
        clerkUserId: "clerk_user_456",
        commentText: "This is a new comment!",
      }

      // Mock user lookup
      const mockUserResult = [{ id: "user-uuid-1" }]
      // Mock comment creation
      const mockCommentResult = [
        {
          id: "comment-uuid-new",
          post_id: "test-post-123",
          comment_text: "This is a new comment!",
          user_id: "user-uuid-1",
          created_at: `${new Date("2024-01-15T12:00:00.000Z")}`,
        },
      ]

      mockSql
        .mockResolvedValueOnce(mockUserResult) // First call for user lookup
        .mockResolvedValueOnce(mockCommentResult) // Second call for comment creation

      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual(mockCommentResult[0])
      expect(mockSql).toHaveBeenCalledTimes(2)
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return 400 error when required fields are missing", async () => {
      const requestBody = {
        postId: "test-post-123",
        // Missing clerkUserId and commentText
      }

      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing fields" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 404 error when user is not found", async () => {
      const requestBody = {
        postId: "test-post-123",
        clerkUserId: "nonexistent_user",
        commentText: "This is a new comment!",
      }

      // Mock empty user result
      mockSql.mockResolvedValue([])

      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(404)
      expect(responseBody).toEqual({ error: "User not found" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 500 error when database operation fails", async () => {
      const requestBody = {
        postId: "test-post-123",
        clerkUserId: "clerk_user_456",
        commentText: "This is a new comment!",
      }

      const dbError = new Error("Insert failed")
      mockSql.mockRejectedValue(dbError)

      const req = new NextRequest("http://localhost/api/comments", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await POST(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({
        error: "DB error",
        detail: "Error: Insert failed",
      })
    })
  })

  describe("DELETE /api/comments", () => {
    it("should delete a comment successfully", async () => {
      const commentId = "comment-uuid-1"
      const clerkUserId = "clerk_user_456"

      // Mock user lookup
      const mockUserResult = [{ id: "user-uuid-1" }]
      // Mock comment lookup
      const mockCommentResult = [{ user_id: "user-uuid-1" }]

      mockSql
        .mockResolvedValueOnce(mockUserResult) // User lookup
        .mockResolvedValueOnce(mockCommentResult) // Comment lookup
        .mockResolvedValueOnce([]) // Delete operation

      const requestUrl = `http://localhost/api/comments?id=${commentId}&clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl, { method: "DELETE" })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({ success: true })
      expect(mockSql).toHaveBeenCalledTimes(3)
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should return 400 error when commentId or clerkUserId is missing", async () => {
      const requestUrl = "http://localhost/api/comments?id=comment-uuid-1"
      // Missing clerkUserId
      const req = new NextRequest(requestUrl, { method: "DELETE" })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing comment ID or user ID" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 404 error when user is not found", async () => {
      const commentId = "comment-uuid-1"
      const clerkUserId = "nonexistent_user"

      // Mock empty user result
      mockSql.mockResolvedValue([])

      const requestUrl = `http://localhost/api/comments?id=${commentId}&clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl, { method: "DELETE" })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(404)
      expect(responseBody).toEqual({ error: "User not found" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 404 error when comment is not found", async () => {
      const commentId = "nonexistent-comment"
      const clerkUserId = "clerk_user_456"

      // Mock user lookup success, comment lookup failure
      const mockUserResult = [{ id: "user-uuid-1" }]
      mockSql
        .mockResolvedValueOnce(mockUserResult) // User lookup succeeds
        .mockResolvedValueOnce([]) // Comment lookup fails

      const requestUrl = `http://localhost/api/comments?id=${commentId}&clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl, { method: "DELETE" })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(404)
      expect(responseBody).toEqual({ error: "Comment not found" })
      expect(mockSql).toHaveBeenCalledTimes(2)
    })

    it("should return 403 error when user is not authorized to delete comment", async () => {
      const commentId = "comment-uuid-1"
      const clerkUserId = "clerk_user_456"

      // Mock user lookup
      const mockUserResult = [{ id: "user-uuid-1" }]
      // Mock comment owned by different user
      const mockCommentResult = [{ user_id: "different-user-uuid" }]

      mockSql
        .mockResolvedValueOnce(mockUserResult) // User lookup
        .mockResolvedValueOnce(mockCommentResult) // Comment lookup

      const requestUrl = `http://localhost/api/comments?id=${commentId}&clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl, { method: "DELETE" })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(403)
      expect(responseBody).toEqual({ error: "Unauthorized" })
      expect(mockSql).toHaveBeenCalledTimes(2)
    })

    it("should return 500 error when database operation fails", async () => {
      const commentId = "comment-uuid-1"
      const clerkUserId = "clerk_user_456"

      const dbError = new Error("Delete operation failed")
      mockSql.mockRejectedValue(dbError)

      const requestUrl = `http://localhost/api/comments?id=${commentId}&clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl, { method: "DELETE" })

      const response = await DELETE(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({
        error: "DB error",
        detail: "Error: Delete operation failed",
      })
    })
  })
})
