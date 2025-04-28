//import {SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs"
import { getHomeData} from "@/lib/getHomeData";
import { Post } from "@/types/index";
import { auth } from "@clerk/nextjs/server";
import "./styles.css"; // contains scroll snap styles

// constant to determine how manh posts are on the page, not implemented yet
// const POSTS_PER_PAGE = 2;

export default async function Home() {
    const { postData } = (await getHomeData() as { postData: Post[] });

    return (
        <>
        {/*<SignedOut> clerk stuff needs to be mocked still
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
        </SignedOut>

        <SignedIn>
            <UserButton />
        </SignedIn>*/}
        <main className="feed-scroll">
            {/* Render visible posts */}
            {postData.map((post) => (
            <PostSection key={post.id} post={post} />
            ))}
        </main>
        </>
    );
}

// Server-rendered post section hmm
function PostSection({ post }: { post: Post }) {
    const mimeType = post.image_data.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    return (
      <section className="post-snap">
        <div className="post-card">
              <p className="post-author">@{post.first_name ?? post.email ?? "Unknown Name"}</p>
              <img src={`data:${mimeType};base64,${post.image_data}`} alt="Fisco" className="post-image" />
              <p className="post-date">{new Date(post.created_at).toLocaleString()}</p>
              <p className="post-likes">Liked by: {post.likes}</p>
              <p className="post-comments">Comments: {post.comments}</p>
            </div>
      </section>
    );
}
