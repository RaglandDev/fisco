import { getHomeData } from "@/lib/getHomeData";
import { Post } from "@/types/index";
import Feed from "@/components/Feed.client";
// import ClientHeader from "@/components/ClientHeader.client";
import DropDownMenu from "@/components/DropDown.client";

const POSTS_PER_PAGE = 5

interface HomeProps {
    offset: number;
}

export async function fetchPosts(offset: number) {
    const postData = (await getHomeData(offset + POSTS_PER_PAGE, 0) as { postData: Post[] });
//     const samplePost: Post = {
//   id: "post123",
//   fk_image_id: "image456",
//   fk_author_id: "user789",
//   created_at: new Date("2025-05-20T14:30:00Z"),
//   likes: ["user1", "user2"],
//   comments: ["comment1", "comment2"],
//   saves: ["user3"],
//   image_data: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...", // example base64 string
//   user_data: '{"bio": "Photographer", "location": "NYC"}',
//   first_name: "Jane",
//   last_name: "Doe",
//   email: "jane.doe@example.com",
//   comment_count: 2,
//   tags: [
//     { x: 0.25, y: 0.4, label: "hat" },
//     { x: 0.6, y: 0.7, label: "sunglasses" }
//   ]
// };
//     return { postData: [samplePost] };
    return postData;
}

export default async function Home({ offset }: HomeProps) {
    const data = await fetchPosts(offset);

    return (
        <>
          {/* <ClientHeader /> */}
          <main className="h-[100dvh] bg-gray-900 flex justify-center items-center overflow-hidden">
            {data ? <Feed postData={data.postData} offset={offset} /> : <p className="bg-white">No posts!</p>}
          </main>
          <DropDownMenu />
        </>
      );
    }