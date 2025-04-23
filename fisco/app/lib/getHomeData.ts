import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/user.action";

export async function getHomeData() {
    const res = await fetch(`${process.env.API_URL}/api/testendpoint`, {
       cache: "no-store",
    });
    const postData = await res.json();
    const user = await currentUser();
  
    if (user) {
      await syncUser();
    }
  
    return { postData };
  
  }