import { getHomeData } from "@/lib/getHomeData";
import { Post } from "@/types/index";
import Feed from "@/components/Feed.client";
import ClientHeader from "@/components/ClientHeader";

const POSTS_PER_PAGE = 5

interface HomeProps {
    offset: number;
}

export async function fetchPosts(offset: number) {
    const postData = (await getHomeData(offset + POSTS_PER_PAGE, 0) as { postData: Post[] });
    return postData;
}

export default async function Home({ offset }: HomeProps) {
    const { postData } = await fetchPosts(offset);

    return (
        <>
          <ClientHeader />
          <main className="h-[100dvh] bg-gray-900 flex justify-center items-center overflow-hidden">
            <Feed postData={postData} offset={offset} />
          </main>
        </>
      );
    }