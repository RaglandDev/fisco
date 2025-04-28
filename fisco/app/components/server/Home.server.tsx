import {SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs"
import { getHomeData} from "@/lib/getHomeData";
import { Post } from "@/types/index";
import "./styles.css"; // contains scroll snap styles
import ClientHome from "../client/Home.client";


const POSTS_PER_PAGE = 4;  // move to globals?

// app/components/server/Home.server.tsx
interface HomeProps {
    offset: number;
}

export async function fetchPosts(offset: number) {
    const postData = (await getHomeData(offset + POSTS_PER_PAGE, 0) as { postData: Post[] });  // Fetch posts from your API or DB
    // console.log('postdata from offset', offset, ':', postData);
    return postData;
}

export default async function Home({ offset }: HomeProps) {
    const {postData} = await fetchPosts(offset);
    return (
        <>
        {/* <SignedOut>
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
        </SignedOut>

        <SignedIn>
            <UserButton />
        </SignedIn> */}


        <main className="feed-scroll">
                {/* Render posts using PostSection */}
                {postData.length > 0 ? (
                    postData.map((post) => (
                        <PostSection key={post.id} post={post} />
                    ))
                ) : (
                    <p>No posts available</p>
                )}
            </main>        

        <ClientHome postData={postData} offset={offset} /> 
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
