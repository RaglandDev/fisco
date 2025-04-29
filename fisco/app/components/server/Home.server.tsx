import { getHomeData} from "@/lib/getHomeData";
import { Post } from "@/types/index";
import Feed from "@/components/client/Feed.client"


export default async function Home() {
    const { postData } = (await getHomeData() as { postData: Post[] });

    return (
        <main className="h-[100dvh] bg-gray-900 flex justify-center items-center overflow-hidden">
            <Feed postData={postData}/>
        </main>
    );
}

