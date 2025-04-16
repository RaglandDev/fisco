"use client";
import { TestDataType } from "@/types/Home.client"
import { useEffect, useRef, useState, useCallback } from "react";
import { Post } from "@/types/Post";

type Props = {
  testData?: TestDataType[];
  // posts?: Post[];
};

// Inline CSS styles used throughout the component
const styles = {
    // Outer container for the feed
    feedContainer: {
      height: "100vh",                         // Full screen height
      overflowY: "scroll" as const,            // Enable vertical scrolling
      scrollSnapType: "y mandatory" as const,  // Snap to posts vertically
      scrollBehavior: "smooth" as const,               // Smooth scroll experience
    },
    // Each individual post container (full screen)
    postContainer: {
      height: "100vh",                         // Each post takes full screen
      scrollSnapAlign: "start" as const,       // Align to top of each post
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "0",
      backgroundColor: "#fff",
      borderBottom: "1px solid #eee",
    },
    // Styling for the post content box
    card: {
      maxWidth: "600px",
      width: "100%",
      maxHeight: "90vh", // stay within the viewport
      overflowY: "auto" as const, // allow scrolling within the card if content overflows
      padding: "2rem",
      borderRadius: "1rem",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      backgroundColor: "#f9f9f9",
      textAlign: "center" as const,
    },
    author: {
      fontWeight: "bold",
      fontSize: "1.25rem",
    },
    image: {
        maxWidth: "100%",
        maxHeight: "70vh",
        height: "auto",
        borderRadius: "0.5rem",
        objectFit: "contain" as const,
    },
    content: {
      margin: "1.5rem 0",
      fontSize: "1.1rem",
    },
    date: {
      fontSize: "0.85rem",
      color: "#888",
    },
};

export default function ClientHome({ testData = [] }: Props) {
    const [visiblePosts, setVisiblePosts] = useState<Post[]>(testData.slice(0, 5));
    const [postIndex, setPostIndex] = useState(5);
    const loaderRef = useRef<HTMLDivElement | null>(null);
  
    // Load more posts, looping back to the start if needed
    const loadMore = useCallback(() => {
        setVisiblePosts((prevVisible) => {
          return [
            ...prevVisible,
            ...Array.from({ length: 5 }).map((_, i) => {
              const nextIndex = (prevVisible.length + i) % testData.length;
              return testData[nextIndex];
            }),
          ];
        });
      
        setPostIndex((prevIndex) => prevIndex + 5);
      }, [testData]);
  
    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadMore();
          }
        },
        {
          rootMargin: "200px",
        }
      );
  
      if (loaderRef.current) {
        observer.observe(loaderRef.current);
      }
  
      return () => {
        if (loaderRef.current) {
          observer.unobserve(loaderRef.current);
        }
      };
    }, [loaderRef, loadMore]);
  
    return (
      <main style={styles.feedContainer}>
        {visiblePosts.map((post, idx) => (
          <section key={`${post.id}-${idx}`} style={styles.postContainer}>
            <div style={styles.card}>
              <p style={styles.author}>@{post.author}</p>
              {/* <img src={post.image} style={styles.image} />
              <p style={styles.content}>{post.content}</p>
              <p style={styles.date}>
                {new Date(post.createdAt).toLocaleString()}
              </p> */}
            </div>
          </section>
        ))}
  
        <div ref={loaderRef} style={{ height: "1px" }} />
      </main>
    );
  }
  


