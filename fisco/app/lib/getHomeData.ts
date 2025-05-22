import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/user.action";

export async function getHomeData(limit: number = 2, offset: number = 0) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/testendpoint?limit=${limit}&offset=${offset}`, {
         cache: "no-store",
      });
      const data = await res.json();
      const postData = data.posts;
      
      const user = await currentUser();
    
      if (user) {
        await syncUser();
      }
    } catch (err) {
      console.log(err)
      return null
    }
    
    return { postData };
  
  }