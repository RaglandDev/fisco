import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// Use vi.hoisted to ensure mockSql is available during hoisting
const mockSql = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

// Import after mocking
const { GET } = await import("@/api/users/me/route")

describe("API Route: /api/users/me", () => {
  beforeEach(() => {
    mockSql.mockReset()
  })

  describe("GET /api/users/me - Get internal user ID", () => {
    it("should return internal user ID successfully", async () => {
      const clerkUserId = "clerk_user_123"
      const mockUserResult = [
        {
          id: "internal-uuid-456",
        },
      ]

      mockSql.mockResolvedValue(mockUserResult)

      const requestUrl = `http://localhost/api/users/me?clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        internalUserId: "internal-uuid-456",
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL call
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(clerkUserId)

      // Check CORS headers
      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*")
      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET, POST, PUT, DELETE, OPTIONS")
      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization")
    })

    it("should return 400 error when clerkUserId is missing", async () => {
      const requestUrl = "http://localhost/api/users/me"
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing clerkUserId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 400 error when clerkUserId is empty string", async () => {
      const requestUrl = "http://localhost/api/users/me?clerkUserId="
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(400)
      expect(responseBody).toEqual({ error: "Missing clerkUserId" })
      expect(mockSql).not.toHaveBeenCalled()
    })

    it("should return 404 error when user is not found", async () => {
      const clerkUserId = "nonexistent_clerk_user"
      const mockEmptyResult: any[] = []

      mockSql.mockResolvedValue(mockEmptyResult)

      const requestUrl = `http://localhost/api/users/me?clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(404)
      expect(responseBody).toEqual({ error: "User not found" })
      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL call was made with the correct parameter
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(clerkUserId)
    })

    it("should return 500 error when database query fails", async () => {
      const clerkUserId = "clerk_user_123"
      const dbError = new Error("Database connection failed")

      mockSql.mockRejectedValue(dbError)

      const requestUrl = `http://localhost/api/users/me?clerkUserId=${clerkUserId}`
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

    it("should handle special characters in clerkUserId", async () => {
      const clerkUserId = "clerk_user_special!@#$%^&*()"
      const mockUserResult = [
        {
          id: "internal-uuid-special",
        },
      ]

      mockSql.mockResolvedValue(mockUserResult)

      const requestUrl = `http://localhost/api/users/me?clerkUserId=${encodeURIComponent(clerkUserId)}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        internalUserId: "internal-uuid-special",
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL call received the decoded clerkUserId
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(clerkUserId)
    })

    it("should handle very long clerkUserId", async () => {
      const clerkUserId = "clerk_user_" + "a".repeat(100) // Very long ID
      const mockUserResult = [
        {
          id: "internal-uuid-long",
        },
      ]

      mockSql.mockResolvedValue(mockUserResult)

      const requestUrl = `http://localhost/api/users/me?clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        internalUserId: "internal-uuid-long",
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the SQL call received the long clerkUserId
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(clerkUserId)
    })

    it("should handle UUID format internal user ID", async () => {
      const clerkUserId = "clerk_user_uuid_test"
      const mockUserResult = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000", // Standard UUID format
        },
      ]

      mockSql.mockResolvedValue(mockUserResult)

      const requestUrl = `http://localhost/api/users/me?clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        internalUserId: "550e8400-e29b-41d4-a716-446655440000",
      })

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle numeric internal user ID", async () => {
      const clerkUserId = "clerk_user_numeric_test"
      const mockUserResult = [
        {
          id: 12345, // Numeric ID
        },
      ]

      mockSql.mockResolvedValue(mockUserResult)

      const requestUrl = `http://localhost/api/users/me?clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        internalUserId: 12345,
      })

      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle database timeout error", async () => {
      const clerkUserId = "clerk_user_timeout"
      const timeoutError = new Error("Query timeout")
      timeoutError.name = "TimeoutError"

      mockSql.mockRejectedValue(timeoutError)

      const requestUrl = `http://localhost/api/users/me?clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(500)
      expect(responseBody).toEqual({
        error: "DB error",
        detail: "TimeoutError: Query timeout",
      })
      expect(mockSql).toHaveBeenCalledTimes(1)
    })

    it("should handle multiple query parameters correctly", async () => {
      const clerkUserId = "clerk_user_multi_params"
      const mockUserResult = [
        {
          id: "internal-uuid-multi",
        },
      ]

      mockSql.mockResolvedValue(mockUserResult)

      // Add extra query parameters that should be ignored
      const requestUrl = `http://localhost/api/users/me?clerkUserId=${clerkUserId}&extra=value&another=param`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        internalUserId: "internal-uuid-multi",
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify only the clerkUserId was used in the SQL call
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(clerkUserId)
    })

    it("should handle case-sensitive clerkUserId", async () => {
      const clerkUserId = "Clerk_User_CaseSensitive_123"
      const mockUserResult = [
        {
          id: "internal-uuid-case",
        },
      ]

      mockSql.mockResolvedValue(mockUserResult)

      const requestUrl = `http://localhost/api/users/me?clerkUserId=${clerkUserId}`
      const req = new NextRequest(requestUrl)

      const response = await GET(req)
      const responseBody = await response.json()

      expect(response.status).toBe(200)
      expect(responseBody).toEqual({
        internalUserId: "internal-uuid-case",
      })

      expect(mockSql).toHaveBeenCalledTimes(1)

      // Verify the exact case was preserved in the SQL call
      const sqlCall = mockSql.mock.calls[0]
      expect(sqlCall.slice(1)).toContain(clerkUserId)
    })
  })
})
