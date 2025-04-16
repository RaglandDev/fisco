import { render, screen } from "@testing-library/react";
import ClientHome from "@/components/client/Home.client";

describe("Home component", () => {
  it("renders list of test data", () => {
    const testData = [
        {
            id: 1,
            author: "alice",
            content: "Hi!",
            createdAt: "2025-04-13T18:45:00Z",
            image: "https://www.beautybymissl.com/wp-content/uploads/2021/05/pale-pastel-yellow-and-black-outfit.jpg",    
            },
          {
            id: 2,
            author: "bob",
            content: "I don't know javascript",
            createdAt: "2025-04-14T09:15:00Z",
            image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
          },
          {
            id: 3,
            author: "bob",
            content: "yay fashion",
            createdAt: "2025-04-14T09:15:00Z",
            image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
          },
    ];

    render(<ClientHome testData={testData} />);

    expect(screen.getByText("alice")).toBeInTheDocument()
    expect(screen.getByText("Hi!")).toBeInTheDocument()
    // screen.debug() useful func
  });
});
