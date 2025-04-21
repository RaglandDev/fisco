import { render, screen } from "@testing-library/react";
import ClientHome from "@/components/client/Home.client";

jest.mock('@clerk/nextjs', () => ({
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: ({ children }) => <>{children}</>,
  SignInButton: ({ children }) => <button>{children || "Sign In"}</button>,
  SignUpButton: ({ children }) => <button>{children || "Sign Up"}</button>,
  UserButton: () => <div>User Avatar</div>,
  ClerkProvider: ({ children }) => <>{children}</>,
}));

describe("Home component", () => {
  it("renders list of test data", () => {
    const testData = [
      { id: 1, name: "Test Item 1" },
      { id: 2, name: "Test Item 2" },
    ];

    render(<ClientHome testData={testData} />);

    expect(screen.getByText("1")).toBeDefined()
    expect(screen.getByText("2")).toBeDefined()
    // screen.debug() useful func
  });
});
