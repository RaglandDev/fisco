import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/user.action";

export async function getHomeData(limit: number = 2, offset: number = 0) {
  let postData = null;  // Declare here to be accessible later

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/testendpoint?limit=${limit}&offset=${offset}`, {
      cache: "no-store",
    });

    const data = await res.json();
    postData = data.posts;

    const user = await currentUser();

    if (user) {
      await syncUser();
    }
  } catch (err) {
    if (err instanceof AggregateError) {
    console.error('AggregateError:', err.message);
    for (const individualError of err.errors) {
      console.error('Individual error:', individualError);
    }
  } else {
    console.error('Error:', err);
  }
    return null;
  }

  if (postData) {
    return { postData };
  }

  return null;
}