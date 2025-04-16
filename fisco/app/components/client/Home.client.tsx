"use client";
import { TestDataType } from "@/types/Home.client"

import { Post } from "@/types/Post";

type Props = {
  //testData: TestDataType[];
  posts: Post[];
};

export default function ClientHome({ posts }: Props) {
  // return (
  //   <ul>
  //     {testData.map((item) => (
  //       <li key={item.id}>{item.id}</li>
  //     ))}
  //   </ul>
  // );
  return (
    <main style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>User Feed</h1>

      <div>
        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              padding: "1rem",
              marginBottom: "1rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              backgroundColor: "#fff"
            }}
          >
            <p style={{ fontWeight: "600" }}>@{post.author}</p>
            <p>{post.content}</p>
            <p style={{ fontSize: "0.85rem", color: "#777" }}>
              {new Date(post.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );

}