import { getHomeData} from "@/lib/getHomeData";
import { Post } from "@/types/index";
import "./styles.css"; // contains scroll snap styles

const POSTS_PER_PAGE = 2;

export default async function Home() {
    // Fetch all posts using getHomeData
    const { postData } = (await getHomeData() as { postData: Post[] });
    // console.log("Fetched postData:", postData.length); // Debugging
  
    return (
      <>
        {/* Main feed container with snapping and scroll styles */}
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
              <img src={`data:${mimeType};base64,${post.image_data}`} className="post-image" />
              <p className="post-date">{new Date(post.created_at).toLocaleString()}</p>
              <p className="post-likes">Liked by: {post.likes}</p>
              <p className="post-comments">Comments: {post.comments}</p>
            </div>
      </section>
    );
}
