import { describe, it, expect, vi, beforeEach } from "vitest"

// Use vi.hoisted to ensure mocks are available during hoisting
const mockSql = vi.hoisted(() => vi.fn())
const mockAuth = vi.hoisted(() => vi.fn())
const mockCurrentUser = vi.hoisted(() => vi.fn())

vi.mock("@neondatabase/serverless", () => ({
  neon: vi.fn(() => mockSql),
}))

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}))

// Import after mocking
const { syncUser } = await import("@/actions/user.action")

describe("Server Action: syncUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSql.mockReset()
    mockAuth.mockReset()
    mockCurrentUser.mockReset()
  })

  it("should create new user when user doesn't exist in database", async () => {
    const mockUserId = "clerk_user_123"
    const mockUser = {
      firstName: "John",
      lastName: "Doe",
      emailAddresses: [{ emailAddress: "john@example.com" }],
      imageUrl: "https://example.com/profile.jpg",
    }

    // Mock Clerk auth and user
    mockAuth.mockResolvedValue({ userId: mockUserId })
    mockCurrentUser.mockResolvedValue(mockUser)

    // Mock database responses
    mockSql
      .mockResolvedValueOnce([]) // User doesn't exist (empty array)
      .mockResolvedValueOnce([]) // Insert operation

    await syncUser()

    expect(mockAuth).toHaveBeenCalledTimes(1)
    expect(mockCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockSql).toHaveBeenCalledTimes(2)

    // Verify the SELECT query
    const selectCall = mockSql.mock.calls[0]
    expect(selectCall.slice(1)).toContain(mockUserId)

    // Verify the INSERT query
    const insertCall = mockSql.mock.calls[1]
    expect(insertCall.slice(1)).toContain(mockUserId)
    expect(insertCall.slice(1)).toContain("john@example.com")
    expect(insertCall.slice(1)).toContain("John")
    expect(insertCall.slice(1)).toContain("Doe")
    expect(insertCall.slice(1)).toContain("https://example.com/profile.jpg")
  })

  it("should update existing user when user exists in database", async () => {
    const mockUserId = "clerk_user_456"
    const mockUser = {
      firstName: "Jane",
      lastName: "Smith",
      emailAddresses: [{ emailAddress: "jane.updated@example.com" }],
      imageUrl: "https://example.com/new-profile.jpg",
    }

    const mockExistingUser = [
      {
        id: "internal-uuid-1",
        clerk_user_id: mockUserId,
        email: "jane.old@example.com",
        first_name: "Jane",
        last_name: "Smith",
        image_url: "https://example.com/old-profile.jpg",
      },
    ]

    // Mock Clerk auth and user
    mockAuth.mockResolvedValue({ userId: mockUserId })
    mockCurrentUser.mockResolvedValue(mockUser)

    // Mock database responses
    mockSql
      .mockResolvedValueOnce(mockExistingUser) // User exists
      .mockResolvedValueOnce([]) // Update operation

    await syncUser()

    expect(mockAuth).toHaveBeenCalledTimes(1)
    expect(mockCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockSql).toHaveBeenCalledTimes(2)

    // Verify the SELECT query
    const selectCall = mockSql.mock.calls[0]
    expect(selectCall.slice(1)).toContain(mockUserId)

    // Verify the UPDATE query
    const updateCall = mockSql.mock.calls[1]
    expect(updateCall.slice(1)).toContain("jane.updated@example.com")
    expect(updateCall.slice(1)).toContain("Jane")
    expect(updateCall.slice(1)).toContain("Smith")
    expect(updateCall.slice(1)).toContain("https://example.com/new-profile.jpg")
    expect(updateCall.slice(1)).toContain(mockUserId)
  })

  it("should handle user with null values", async () => {
    const mockUserId = "clerk_user_null"
    const mockUser = {
      firstName: null,
      lastName: null,
      emailAddresses: [{ emailAddress: "minimal@example.com" }],
      imageUrl: null,
    }

    // Mock Clerk auth and user
    mockAuth.mockResolvedValue({ userId: mockUserId })
    mockCurrentUser.mockResolvedValue(mockUser)

    // Mock database responses
    mockSql
      .mockResolvedValueOnce([]) // User doesn't exist
      .mockResolvedValueOnce([]) // Insert operation

    await syncUser()

    expect(mockSql).toHaveBeenCalledTimes(2)

    // Verify the INSERT query handles null values
    const insertCall = mockSql.mock.calls[1]
    expect(insertCall.slice(1)).toContain(mockUserId)
    expect(insertCall.slice(1)).toContain("minimal@example.com")
    expect(insertCall.slice(1)).toContain(null) // firstName
    expect(insertCall.slice(1)).toContain(null) // lastName
    expect(insertCall.slice(1)).toContain(null) // imageUrl
  })

  it("should handle user with multiple email addresses", async () => {
    const mockUserId = "clerk_user_multi_email"
    const mockUser = {
      firstName: "Multi",
      lastName: "Email",
      emailAddresses: [{ emailAddress: "primary@example.com" }, { emailAddress: "secondary@example.com" }],
      imageUrl: "https://example.com/multi.jpg",
    }

    // Mock Clerk auth and user
    mockAuth.mockResolvedValue({ userId: mockUserId })
    mockCurrentUser.mockResolvedValue(mockUser)

    // Mock database responses
    mockSql
      .mockResolvedValueOnce([]) // User doesn't exist
      .mockResolvedValueOnce([]) // Insert operation

    await syncUser()

    expect(mockSql).toHaveBeenCalledTimes(2)

    // Verify only the first email address is used
    const insertCall = mockSql.mock.calls[1]
    expect(insertCall.slice(1)).toContain("primary@example.com")
    expect(insertCall.slice(1)).not.toContain("secondary@example.com")
  })

  it("should return early when userId is null", async () => {
    // Mock Clerk auth returning null userId
    mockAuth.mockResolvedValue({ userId: null })
    mockCurrentUser.mockResolvedValue(null)

    await syncUser()

    expect(mockAuth).toHaveBeenCalledTimes(1)
    expect(mockCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it("should return early when user is null", async () => {
    // Mock Clerk auth returning userId but currentUser is null
    mockAuth.mockResolvedValue({ userId: "clerk_user_123" })
    mockCurrentUser.mockResolvedValue(null)

    await syncUser()

    expect(mockAuth).toHaveBeenCalledTimes(1)
    expect(mockCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it("should return early when both userId and user are null", async () => {
    // Mock Clerk auth returning null for both
    mockAuth.mockResolvedValue({ userId: null })
    mockCurrentUser.mockResolvedValue(null)

    await syncUser()

    expect(mockAuth).toHaveBeenCalledTimes(1)
    expect(mockCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockSql).not.toHaveBeenCalled()
  })

  it("should handle database error during user lookup gracefully", async () => {
    const mockUserId = "clerk_user_db_error"
    const mockUser = {
      firstName: "Error",
      lastName: "User",
      emailAddresses: [{ emailAddress: "error@example.com" }],
      imageUrl: "https://example.com/error.jpg",
    }

    // Mock Clerk auth and user
    mockAuth.mockResolvedValue({ userId: mockUserId })
    mockCurrentUser.mockResolvedValue(mockUser)

    // Mock database error
    const dbError = new Error("Database connection failed")
    mockSql.mockRejectedValue(dbError)

    // Mock console.error to verify it's called
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await syncUser()

    expect(mockAuth).toHaveBeenCalledTimes(1)
    expect(mockCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockSql).toHaveBeenCalledTimes(1)
    expect(consoleSpy).toHaveBeenCalledWith("Error syncing user:", dbError)

    consoleSpy.mockRestore()
  })

  it("should handle database error during user insert gracefully", async () => {
    const mockUserId = "clerk_user_insert_error"
    const mockUser = {
      firstName: "Insert",
      lastName: "Error",
      emailAddresses: [{ emailAddress: "insert@example.com" }],
      imageUrl: "https://example.com/insert.jpg",
    }

    // Mock Clerk auth and user
    mockAuth.mockResolvedValue({ userId: mockUserId })
    mockCurrentUser.mockResolvedValue(mockUser)

    // Mock database responses
    const insertError = new Error("Insert operation failed")
    mockSql
      .mockResolvedValueOnce([]) // User doesn't exist
      .mockRejectedValueOnce(insertError) // Insert fails

    // Mock console.error to verify it's called
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await syncUser()

    expect(mockSql).toHaveBeenCalledTimes(2)
    expect(consoleSpy).toHaveBeenCalledWith("Error syncing user:", insertError)

    consoleSpy.mockRestore()
  })

  it("should handle database error during user update gracefully", async () => {
    const mockUserId = "clerk_user_update_error"
    const mockUser = {
      firstName: "Update",
      lastName: "Error",
      emailAddresses: [{ emailAddress: "update@example.com" }],
      imageUrl: "https://example.com/update.jpg",
    }

    const mockExistingUser = [
      {
        id: "internal-uuid-update",
        clerk_user_id: mockUserId,
        email: "old@example.com",
        first_name: "Old",
        last_name: "Name",
        image_url: "https://example.com/old.jpg",
      },
    ]

    // Mock Clerk auth and user
    mockAuth.mockResolvedValue({ userId: mockUserId })
    mockCurrentUser.mockResolvedValue(mockUser)

    // Mock database responses
    const updateError = new Error("Update operation failed")
    mockSql
      .mockResolvedValueOnce(mockExistingUser) // User exists
      .mockRejectedValueOnce(updateError) // Update fails

    // Mock console.error to verify it's called
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await syncUser()

    expect(mockSql).toHaveBeenCalledTimes(2)
    expect(consoleSpy).toHaveBeenCalledWith("Error syncing user:", updateError)

    consoleSpy.mockRestore()
  })

  it("should handle Clerk auth error gracefully", async () => {
    // Mock Clerk auth throwing an error
    const authError = new Error("Clerk authentication failed")
    mockAuth.mockRejectedValue(authError)

    // Mock console.error to verify it's called
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await syncUser()

    expect(mockAuth).toHaveBeenCalledTimes(1)
    expect(mockCurrentUser).not.toHaveBeenCalled()
    expect(mockSql).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith("Error syncing user:", authError)

    consoleSpy.mockRestore()
  })

  it("should handle currentUser error gracefully", async () => {
    const mockUserId = "clerk_user_current_error"

    // Mock Clerk auth succeeding but currentUser failing
    mockAuth.mockResolvedValue({ userId: mockUserId })
    const currentUserError = new Error("Failed to get current user")
    mockCurrentUser.mockRejectedValue(currentUserError)

    // Mock console.error to verify it's called
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await syncUser()

    expect(mockAuth).toHaveBeenCalledTimes(1)
    expect(mockCurrentUser).toHaveBeenCalledTimes(1)
    expect(mockSql).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith("Error syncing user:", currentUserError)

    consoleSpy.mockRestore()
  })

  it("should handle user with empty email addresses array", async () => {
    const mockUserId = "clerk_user_no_email"
    const mockUser = {
      firstName: "No",
      lastName: "Email",
      emailAddresses: [], // Empty array
      imageUrl: "https://example.com/noemail.jpg",
    }

    // Mock Clerk auth and user
    mockAuth.mockResolvedValue({ userId: mockUserId })
    mockCurrentUser.mockResolvedValue(mockUser)

    // This should cause an error when trying to access emailAddresses[0]
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await syncUser()

    expect(consoleSpy).toHaveBeenCalled()
    const errorCall = consoleSpy.mock.calls[0]
    expect(errorCall[0]).toBe("Error syncing user:")

    consoleSpy.mockRestore()
  })
})
