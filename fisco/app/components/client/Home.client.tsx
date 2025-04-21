"use client";
import { TestDataType } from "@/types/Home.client"
import { useEffect, useRef, useState, useCallback } from "react";
import { Post } from "@/types/Post";

const POSTS_PER_PAGE = 5;


export default function ClientHome({
    allPosts,
    initialCount,
  }: {
    allPosts: Post[];
    initialCount: number;
  })
{
  const [count, setCount] = useState(initialCount);

  // Get posts to display up to the current page count
  const visiblePosts = allPosts.slice(0, count);

  // Load more when button clicked
  const loadMore = () => {
    setCount((prev) => prev + POSTS_PER_PAGE);
  };

  return (
    <>
      {visiblePosts.slice(initialCount).map((post) => (
        <section key={post.id} className="post-snap">
          <div className="post-card">
            <p className="post-author">@{post.author}</p>
          </div>
        </section>
      ))}

      {/* Show button only if more posts are available */}
      {count < allPosts.length && (
        <button className="load-more-btn" onClick={loadMore}>
          Load More
        </button>
      )}
    </>
  );
}
  


