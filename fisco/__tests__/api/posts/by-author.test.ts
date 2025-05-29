import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Use vi.hoisted to ensure mockSql is available during hoisting
const mockSql = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

// Import after mocking
const { POST } = await import("@/api/posts/by-author/route")

describe("API Route: /api/posts/by-author", () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  it("should fetch posts by author successfully", async () => {
    const requestBody = {
      authorId: "clerk_user_123",
    }

    // Mock user lookup
    const mockUserResult = [{ id: "user-uuid-1" }]

    // Mock posts result
    const mockPostsResult = [
      {
        id: "post-uuid-1",
        image_url: "https://example-bucket.s3.amazonaws.com/image1.jpg",
      },
      {
        id: "post-uuid-2",
        image_url: "https://example-bucket.s3.amazonaws.com/image2.jpg",
      },
    ]

    mockSql
      .mockResolvedValueOnce(mockUserResult) // First call for user lookup
      .mockResolvedValueOnce(mockPostsResult) // Second call for posts fetch

    const req = new NextRequest("http://localhost/api/posts/by-author", {
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
      ],
    })

    expect(mockSql).toHaveBeenCalledTimes(2)

    // Verify the SQL calls
    const userLookupCall = mockSql.mock.calls[0]
    const postsFetchCall = mockSql.mock.calls[1]

    expect(userLookupCall.slice(1)).toContain(requestBody.authorId)
    expect(postsFetchCall.slice(1)).toContain("user-uuid-1") // internal author ID
  })

  it("should return empty posts array when author has no posts", async () => {
    const requestBody = {
      authorId: "clerk_user_123",
    }

    // Mock user lookup
    const mockUserResult = [{ id: "user-uuid-1" }]

    // Mock empty posts result
    const mockPostsResult: any[] = []

    mockSql
      .mockResolvedValueOnce(mockUserResult) // User lookup succeeds
      .mockResolvedValueOnce(mockPostsResult) // No posts found

    const req = new NextRequest("http://localhost/api/posts/by-author", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(req)
    const responseBody = await response.json()

    expect(response.status).toBe(200)
    expect(responseBody).toEqual({ posts: [] })
    expect(mockSql).toHaveBeenCalledTimes(2)
  })

  it("should return 400 error when authorId is missing", async () => {
    const requestBody = {
      // Missing authorId
    }

    const req = new NextRequest("http://localhost/api/posts/by-author", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(req)
    const responseBody = await response.json()

    expect(response.status).toBe(400)
    expect(responseBody).toEqual({ error: "Missing authorId" })
    expect(mockSql).not.toHaveBeenCalled()
  })

  it("should return 404 error when user is not found", async () => {
    const requestBody = {
      authorId: "nonexistent_user",
    }

    // Mock empty user result
    mockSql.mockResolvedValue([])

    const req = new NextRequest("http://localhost/api/posts/by-author", {
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

  it("should return 500 error when database fails during user lookup", async () => {
    const requestBody = {
      authorId: "clerk_user_123",
    }

    const dbError = new Error("Database connection failed")
    mockSql.mockRejectedValue(dbError)

    const req = new NextRequest("http://localhost/api/posts/by-author", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(req)
    const responseBody = await response.json()

    expect(response.status).toBe(500)
    expect(responseBody).toEqual({ error: "Failed to fetch posts" })
    expect(mockSql).toHaveBeenCalledTimes(1)
  })

  it("should return 500 error when database fails during posts fetch", async () => {
    const requestBody = {
      authorId: "clerk_user_123",
    }

    // Mock user lookup success, posts fetch failure
    const mockUserResult = [{ id: "user-uuid-1" }]
    const dbError = new Error("Posts fetch failed")

    mockSql
      .mockResolvedValueOnce(mockUserResult) // User lookup succeeds
      .mockRejectedValueOnce(dbError) // Posts fetch fails

    const req = new NextRequest("http://localhost/api/posts/by-author", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(req)
    const responseBody = await response.json()

    expect(response.status).toBe(500)
    expect(responseBody).toEqual({ error: "Failed to fetch posts" })
    expect(mockSql).toHaveBeenCalledTimes(2)
  })

  it("should handle malformed JSON in request body", async () => {
    const req = new NextRequest("http://localhost/api/posts/by-author", {
      method: "POST",
      body: "invalid json{",
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(req)
    const responseBody = await response.json()

    expect(response.status).toBe(500)
    expect(responseBody).toEqual({ error: "Failed to fetch posts" })
    expect(mockSql).not.toHaveBeenCalled()
  })

  it("should handle null or undefined authorId", async () => {
    const requestBody = {
      authorId: null,
    }

    const req = new NextRequest("http://localhost/api/posts/by-author", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(req)
    const responseBody = await response.json()

    expect(response.status).toBe(400)
    expect(responseBody).toEqual({ error: "Missing authorId" })
    expect(mockSql).not.toHaveBeenCalled()
  })

  it("should handle empty string authorId", async () => {
    const requestBody = {
      authorId: "",
    }

    const req = new NextRequest("http://localhost/api/posts/by-author", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(req)
    const responseBody = await response.json()

    expect(response.status).toBe(400)
    expect(responseBody).toEqual({ error: "Missing authorId" })
    expect(mockSql).not.toHaveBeenCalled()
  })
})
