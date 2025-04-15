import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock the server-side function
vi.mock("@/lib/getHomeData", () => ({
  getHomeData: vi.fn().mockResolvedValue({
    testData: [
      { id: 1, name: "Test Item 1" },
      { id: 2, name: "Test Item 2" },
    ],
  }),
}));

import Home from "@/components/server/Home.server";

describe("Home server component", () => {
  it("renders Home with server-fetched data", async () => {
    render(await Home());

    expect(await screen.findByText("1")).toBeDefined();
    expect(await screen.findByText("2")).toBeDefined();
  });
});
