//import {SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs"
import { getHomeData} from "@/lib/getHomeData";
import { Post } from "@/types/index";
import {PostSection} from "@/components/server/PostSection"
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

