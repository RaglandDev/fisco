import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/user.action";

export async function getHomeData(limit: number = 2, offset: number = 0) {
  let postData = null;  // Declare here to be accessible later

  try {
    const baseUrl = "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/testendpoint?limit=${limit}&offset=${offset}`, {
      cache: "no-store",
    });

    const data = await res.json();
    postData = data.posts;

    const user = await currentUser();

    if (user) {
      await syncUser();
    }
  } catch (err) {
    console.log(err);
    return null;
  }

  if (postData) {
    return { postData };
  }

  return null;
}
