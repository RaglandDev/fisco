import { getHomeData } from "@/lib/fetch/server/GET"
import type { Post } from "@/types/index"
import Feed from "@/components/Feed.client"
import DropDownMenu from "@/components/DropDown.client"

const POSTS_PER_PAGE = 5

interface HomeProps {
  offset: number
}

export async function fetchPosts(offset: number) {
  const result = (await getHomeData(POSTS_PER_PAGE, offset)) as { postData: Post[] } | null;
  const postData = result?.postData ?? [];
  return { postData };}


export default async function Home({ offset }: HomeProps) {
  const data = await fetchPosts(offset)

  return (
    <>
      <main className="h-[100dvh] bg-gray-900 flex justify-center items-center overflow-hidden">
        {data.postData.length > 0 ? (
          <Feed postData={data.postData} offset={offset} />
        ) : (
          <div className="flex flex-col items-center justify-center">
            <p className="text-gray-400 text-2xl font-medium text-center">Looks like there aren&apos;t any posts...</p>
          </div>
        )}
      </main>
      <DropDownMenu />
    </>
  )
}
