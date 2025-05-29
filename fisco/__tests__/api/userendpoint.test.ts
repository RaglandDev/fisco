import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Use vi.hoisted to ensure mockSql is available during hoisting
const mockSql = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

// Import after mocking
const { GET } = await import("@/api/userendpoint/route")

describe("API Route: /api/userendpoint", () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  describe("GET /api/userendpoint - Fetch user and posts", () => {
    it("should fetch user and posts successfully", async () => {
      const userId = "clerk_user_123"
      const mockUserAndPostsResult = [
        {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          image_url: "https://example.com/profile.jpg",
          bio: "Software developer and photographer",
          post_id: "post-uuid-1",
          created_at: `${new Date("2024-01-15T10:30:00.000Z")}`,
          likes: { user1: true, user2: true },
          comments: { comment1: "Great post!", comment2: "Nice work!" },
          image_data: "images/post1.jpg",
        },
        {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          image_url: "https://example.com/profile.jpg",
          bio: "Software developer and photographer",
          post_id: "post-uuid-2",
          created_at: `${new Date("2024-01-14T09:15:00.000Z")}`,
          likes: { user3: true },
          comments: {},
          image_data: "images/post2.jpg",
        },
      ]

      mockSql.mockResolvedValue(mockUserAndPostsResult)

      const requestUrl = `http://localhost/api/userendpoint?userId=${userId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        user: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          image_url: "https://example.com/profile.jpg",
          bio: "Software developer and photographer",
        },
        posts: [
          {
            post_id: "post-uuid-1",
            created_at: `${new Date("2024-01-15T10:30:00.000Z")}`,
            likes: { user1: true, user2: true },
            comments: { comment1: "Great post!", comment2: "Nice work!" },
            image_data: "images/post1.jpg",
          },
          {
            post_id: "post-uuid-2",
            created_at: `${new Date("2024-01-14T09:15:00.000Z")}`,
            likes: { user3: true },
            comments: {},
            image_data: "images/post2.jpg",
          },
        ],
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL call
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(userId)

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS")
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization")
    })

    it("should fetch user with no posts successfully", async () => {
      const userId = "clerk_user_456"
      const mockUserOnlyResult = [
        {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          bio: null,
          image_url: null
        },
      ]

      mockSql.mockResolvedValue(mockUserOnlyResult)

      const requestUrl = `http://localhost/api/userendpoint?userId=${userId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        user: {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          image_url: null,
          bio: null,
        },
        posts: [{}],
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
    })

    it("should fetch user with single post successfully", async () => {
      const userId = "clerk_user_789"
      const mockSinglePostResult = [
        {
          first_name: "Bob",
          last_name: "Johnson",
          email: "bob@example.com",
          image_url: "https://example.com/bob-profile.jpg",
          bio: "Travel enthusiast",
          post_id: "post-uuid-single",
          created_at: `${new Date("2024-01-16T14:20:00.000Z")}`,
          likes: {},
          comments: { comment1: "Amazing!" },
          image_data: "images/travel.jpg",
        },
      ]

      mockSql.mockResolvedValue(mockSinglePostResult)

      const requestUrl = `http://localhost/api/userendpoint?userId=${userId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        user: {
          first_name: "Bob",
          last_name: "Johnson",
          email: "bob@example.com",
          image_url: "https://example.com/bob-profile.jpg",
          bio: "Travel enthusiast",
        },
        posts: [
          {
            post_id: "post-uuid-single",
            created_at: `${new Date("2024-01-16T14:20:00.000Z")}`,
            likes: {},
            comments: { comment1: "Amazing!" },
            image_data: "images/travel.jpg",
          },
        ],
      })

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 400 error when userId is missing", async () => {
      const requestUrl = "http://localhost/api/userendpoint"
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "User ID is required" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when userId is empty string", async () => {
      const requestUrl = "http://localhost/api/userendpoint?userId="
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "User ID is required" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 404 error when user is not found", async () => {
      const userId = "nonexistent_user"
      const mockEmptyResult: any[] = []

      mockSql.mockResolvedValue(mockEmptyResult)

      const requestUrl = `http://localhost/api/userendpoint?userId=${userId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(404)
      expect(responseBody).toEqual({ error: "User or posts not found" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 500 error when database query fails", async () => {
      const userId = "clerk_user_123"
      const dbError = new Error("Database connection failed")

      mockSql.mockRejectedValue(dbError)

      const requestUrl = `http://localhost/api/userendpoint?userId=${userId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Internal server error" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle user with minimal data", async () => {
      const userId = "clerk_user_minimal"
      const mockMinimalUserResult = [
        {
          first_name: "Min",
          last_name: "User",
          email: "min@example.com",
          image_url: null,
          bio: null,
          post_id: "post-minimal",
          created_at: `${new Date("2024-01-10T12:00:00.000Z")}`,
          likes: null,
          comments: null,
          image_data: null,
        },
      ]

      mockSql.mockResolvedValue(mockMinimalUserResult)

      const requestUrl = `http://localhost/api/userendpoint?userId=${userId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        user: {
          first_name: "Min",
          last_name: "User",
          email: "min@example.com",
          image_url: null,
          bio: null,
        },
        posts: [
          {
            post_id: "post-minimal",
            created_at: `${new Date("2024-01-10T12:00:00.000Z")}`,
            likes: null,
            comments: null,
            image_data: null,
          },
        ],
      })

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle user with many posts", async () => {
      const userId = "clerk_user_prolific"
      const mockManyPostsResult = Array.from({ length: 5 }, (_, index) => ({
        first_name: "Prolific",
        last_name: "User",
        email: "prolific@example.com",
        image_url: "https://example.com/prolific.jpg",
        bio: "Content creator",
        post_id: `post-uuid-${index + 1}`,
        created_at: `${new Date(`2024-01-${10 + index}T10:00:00.000Z`)}`,
        likes: { [`user${index + 1}`]: true },
        comments: { [`comment${index + 1}`]: `Comment ${index + 1}` },
        image_data: `images/post${index + 1}.jpg`,
      }))

      mockSql.mockResolvedValue(mockManyPostsResult)

      const requestUrl = `http://localhost/api/userendpoint?userId=${userId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.user).toEqual({
        first_name: "Prolific",
        last_name: "User",
        email: "prolific@example.com",
        image_url: "https://example.com/prolific.jpg",
        bio: "Content creator",
      })
      expect(responseBody.posts).toHaveLength(5)
      expect(responseBody.posts[0]).toEqual({
        post_id: "post-uuid-1",
        created_at: `${new Date("2024-01-10T10:00:00.000Z")}`,
        likes: { user1: true },
        comments: { comment1: "Comment 1" },
        image_data: "images/post1.jpg",
      })

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle special characters in userId", async () => {
      const userId = "clerk_user_special!@#$%"
      const mockSpecialUserResult = [
        {
          first_name: "Special",
          last_name: "Character",
          email: "special@example.com",
          image_url: null,
          bio: "User with special characters",
          posts: [{}]
        },
      ]

      mockSql.mockResolvedValue(mockSpecialUserResult)

      const requestUrl = `http://localhost/api/userendpoint?userId=${encodeURIComponent(userId)}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.user.first_name).toBe("Special")
      expect(responseBody.posts).toEqual([{}])

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL call received the decoded userId
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(userId)
    })
  })
})
