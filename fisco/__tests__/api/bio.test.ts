import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Use vi.hoisted to ensure mockSql is available during hoisting
const mockSql = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

// Import after mocking
const { PUT } = await import("@/api/bio/route")

describe("API Route: /api/bio", () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  describe("PUT /api/bio - Update user bio", () => {
    it("should update user bio successfully", async () => {
      const requestBody = {
        userId: "clerk_user_123",
        bio: "Software developer passionate about creating amazing user experiences.",
      }

      const mockUpdatedUser = [
        {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          bio: "Software developer passionate about creating amazing user experiences.",
        },
      ]

      mockSql.mockResolvedValue(mockUpdatedUser)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        user: {
          first_name: "John",
          last_name: "Doe",
          email: "john@example.com",
          bio: "Software developer passionate about creating amazing user experiences.",
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL call
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(requestBody.bio)
      expect(sqlCall.slice(1)).toContain(requestBody.userId)

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS")
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization")
    })

    it("should update bio with short text", async () => {
      const requestBody = {
        userId: "clerk_user_456",
        bio: "Hi!",
      }

      const mockUpdatedUser = [
        {
          first_name: "Jane",
          last_name: "Smith",
          email: "jane@example.com",
          bio: "Hi!",
        },
      ]

      mockSql.mockResolvedValue(mockUpdatedUser)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.user.bio).toBe("Hi!")

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should update bio with long text", async () => {
      const longBio = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(10)
      const requestBody = {
        userId: "clerk_user_789",
        bio: longBio,
      }

      const mockUpdatedUser = [
        {
          first_name: "Bob",
          last_name: "Johnson",
          email: "bob@example.com",
          bio: longBio,
        },
      ]

      mockSql.mockResolvedValue(mockUpdatedUser)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.user.bio).toBe(longBio)

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should update bio with special characters", async () => {
      const requestBody = {
        userId: "clerk_user_special",
        bio: "🚀 Developer & Designer! Love coding 💻 #TechLife @company",
      }

      const mockUpdatedUser = [
        {
          first_name: "Special",
          last_name: "User",
          email: "special@example.com",
          bio: "🚀 Developer & Designer! Love coding 💻 #TechLife @company",
        },
      ]

      mockSql.mockResolvedValue(mockUpdatedUser)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.user.bio).toBe("🚀 Developer & Designer! Love coding 💻 #TechLife @company")

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should update bio with multiline text", async () => {
      const requestBody = {
        userId: "clerk_user_multiline",
        bio: "Line 1\nLine 2\nLine 3\n\nParagraph 2",
      }

      const mockUpdatedUser = [
        {
          first_name: "Multi",
          last_name: "Line",
          email: "multi@example.com",
          bio: "Line 1\nLine 2\nLine 3\n\nParagraph 2",
        },
      ]

      mockSql.mockResolvedValue(mockUpdatedUser)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.user.bio).toBe("Line 1\nLine 2\nLine 3\n\nParagraph 2")

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 400 error when userId is missing", async () => {
      const requestBody = {
        bio: "This is a bio without userId",
        // Missing userId
      }

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "User ID is required" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when bio is missing", async () => {
      const requestBody = {
        userId: "clerk_user_123",
        // Missing bio
      }

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Bio is required" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when both userId and bio are missing", async () => {
      const requestBody = {
        // Missing both userId and bio
      }

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "User ID is required" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when userId is empty string", async () => {
      const requestBody = {
        userId: "",
        bio: "This is a bio with empty userId",
      }

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "User ID is required" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when bio is empty string", async () => {
      const requestBody = {
        userId: "clerk_user_123",
        bio: "",
      }

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Bio is required" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 404 error when user is not found", async () => {
      const requestBody = {
        userId: "nonexistent_user",
        bio: "This user does not exist",
      }

      const mockEmptyResult: any[] = []
      mockSql.mockResolvedValue(mockEmptyResult)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(404)
      expect(responseBody).toEqual({ error: "User not found" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should return 500 error when database operation fails", async () => {
      const requestBody = {
        userId: "clerk_user_123",
        bio: "This will cause a database error",
      }

      const dbError = new Error("Database connection failed")
      mockSql.mockRejectedValue(dbError)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({ error: "Internal server error" })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle null values in returned user data", async () => {
      const requestBody = {
        userId: "clerk_user_null",
        bio: "User with some null fields",
      }

      const mockUpdatedUser = [
        {
          first_name: null,
          last_name: "User",
          email: "null@example.com",
          bio: "User with some null fields",
        },
      ]

      mockSql.mockResolvedValue(mockUpdatedUser)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        user: {
          first_name: null,
          last_name: "User",
          email: "null@example.com",
          bio: "User with some null fields",
        },
      })

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle bio with only whitespace", async () => {
      const requestBody = {
        userId: "clerk_user_whitespace",
        bio: "   \n\t   ",
      }

      const mockUpdatedUser = [
        {
          first_name: "White",
          last_name: "Space",
          email: "whitespace@example.com",
          bio: "   \n\t   ",
        },
      ]

      mockSql.mockResolvedValue(mockUpdatedUser)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.user.bio).toBe("   \n\t   ")

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle SQL injection attempt in bio", async () => {
      const requestBody = {
        userId: "clerk_user_injection",
        bio: "'; DROP TABLE users; --",
      }

      const mockUpdatedUser = [
        {
          first_name: "Safe",
          last_name: "User",
          email: "safe@example.com",
          bio: "'; DROP TABLE users; --",
        },
      ]

      mockSql.mockResolvedValue(mockUpdatedUser)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.user.bio).toBe("'; DROP TABLE users; --")

      expect(mockSql).toHaveBeenCalledTimes(1)
      // The parameterized query should safely handle this
    })

    it("should handle very long userId", async () => {
      const longUserId = "clerk_user_" + "a".repeat(200)
      const requestBody = {
        userId: longUserId,
        bio: "User with very long ID",
      }

      const mockUpdatedUser = [
        {
          first_name: "Long",
          last_name: "ID",
          email: "longid@example.com",
          bio: "User with very long ID",
        },
      ]

      mockSql.mockResolvedValue(mockUpdatedUser)

      const req = new NextRequest("http://localhost/api/bio", {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      })

      const response = await PUT(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody.user.bio).toBe("User with very long ID")

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the long userId was used in the SQL call
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(longUserId)
    })
  })
})
