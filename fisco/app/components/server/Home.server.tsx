import {SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs"
import { getHomeData, getPostData } from "@/lib/getHomeData";
import { Post } from "@/types/Post";
import ClientHome from "@/components/client/Home.client";
import "./styles.css"; // contains scroll snap styles

const POSTS_PER_PAGE = 5;

export default async function Home() {
  const { testData } = await getHomeData();
  
  // Initial posts to render immediately on the server
  const initialPosts = testData.slice(0, POSTS_PER_PAGE);
  return (
    <>
      {/* Clerk auth UI placeholders */}
      {/* 
        <SignedOut>
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      */}

      {/* Main feed container with snapping and scroll styles */}
      <main className="feed-scroll">
        {/* Render initial batch of posts server-side */}
        {initialPosts.map((post) => (
          <PostSection key={post.id} post={post} />
        ))}

        {/* Client component for handling pagination / infinite scroll */}
        <ClientHome allPosts={testData} initialCount={POSTS_PER_PAGE} />
      </main>
    </>
  );
}

// Server-rendered post section
function PostSection({ post }: { post: Post }) {
    return (
      <section className="post-snap">
        <div className="post-card">
          <p className="post-author">@{post.id}</p>
          <img src={post.image} className="post-image" />
          <p className="post-content">{post.content}</p>
          <p className="post-date">{new Date(post.createdAt).toLocaleString()}</p>
        </div>
      </section>
    );
}