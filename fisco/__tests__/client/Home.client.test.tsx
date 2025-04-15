import { render, screen } from "@testing-library/react";
import ClientHome from "@/components/client/Home.client";

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
