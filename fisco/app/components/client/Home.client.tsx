'use client';

import { useEffect, useState } from 'react';
import { useRouter} from 'next/navigation'; 
import { Post } from "@/types/index";

//import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

const POSTS_PER_PAGE = 4;

export default function ClientHome({ postData, offset }: { postData: Post[], offset: number }) {
  const router = useRouter();
  const [posts, _setPosts] = useState(postData)
  const [currentOffset, setCurrentOffset] = useState(offset);
  const [totalPosts, setTotalPosts] = useState<number>(0);

  // Fetch the total number of posts once 
  useEffect(() => {
    const fetchTotalPosts = async () => {
      const response = await fetch('/api/testendpoint?limit=1&offset=0');  
      const data = await response.json();
      setTotalPosts(data.totalCount);  // Set the total number of posts
    };
    fetchTotalPosts();
  });

  // update url when user reaches bottom
  useEffect(() => {
    const feedScrollElement = document.querySelector('.feed-scroll');
  
    if (feedScrollElement) {
      const handleScroll = async () => {
        if ( feedScrollElement.scrollTop + feedScrollElement.clientHeight >= feedScrollElement.scrollHeight - 10 ) {
          if (totalPosts < (currentOffset)) {
            return;  //if less posts than offset + current post set, no more updates
          }
          const newOffset = currentOffset + POSTS_PER_PAGE;
          router.push(`/?offset=${newOffset}`);
          setCurrentOffset(newOffset);
        }
      };
      feedScrollElement.addEventListener("scroll", handleScroll);
      return () => feedScrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [currentOffset, router, posts]);
  
  
  return (
    <div style={{ padding: '2rem' }}>
      {/* <h1>Welcome to Fisco!</h1>
        <ClerkProvider>
            <SignedOut>
                <div style={{ marginBottom: '1rem' }}>
                <SignInButton mode="modal">
                    <button style={{ marginRight: '1rem' }}>Sign In</button>
                </SignInButton>

                <SignUpButton mode="modal">
                    <button>Sign Up</button>
                </SignUpButton>
                </div>
            </SignedOut>
        </ClerkProvider>

      <SignedIn>
        <div style={{ marginBottom: '1rem' }}>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn> */}

      {/* Render the list of posts */}
      <main>
        {posts.map((post) => (
            <div key={post.id}>{post.first_name}</div>  //placeholder
        ))}
      </main>

    </div>
  );
}