import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/user.action";


export async function getHomeData(limit: number = 2, offset: number = 0) {
  console.log('inside gethomedata, offset:', offset)
  const res = await fetch(`${process.env.API_URL}/api/testendpoint?limit=${limit}&offset=${offset}`, {
    cache: "no-store",
    });
    const postData = await res.json();

    const user = await currentUser();
  
    if (user) {
      await syncUser();
    }
  
    return { postData };
  
  }