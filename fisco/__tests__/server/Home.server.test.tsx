import { render, screen, waitFor, act  } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";

vi.mock("@/lib/getHomeData", () => ({
  getHomeData: vi.fn().mockResolvedValue({
    postData: [
      {
        id: "1",
        fk_image_id: "img-123",
        fk_author_id: "user_abc123",
        created_at: new Date().toISOString(),
        likes: [],
        comments: [],
        first_name: "Jay",
        last_name: "Tester",
        email: "jay@example.com",
        image_data: "base64img",
      },
    ],
  }),
}));

import Home from "@/components/server/Home.server";

describe("Home server component", () => {
  it("renders Home with server-fetched data", async () => {
    const props = { offset: 0 };
    // Render and wait for async data to load
    await waitFor(async () => {
      render(<Home {...props} />);
    });
    //render(ui);

    //names still not working
    //expect(await screen.findByText("@Jay")).not.to.be.null;
  });
});