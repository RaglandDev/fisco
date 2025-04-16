import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/user.action";

import { Post } from "@/types/Post";


export async function getHomeData() {
  // const res = await fetch(`${process.env.API_URL}/api/testendpoint`, {
  //    cache: "no-store",
  // });
  // const testData = await res.json();
  // const user = await currentUser();

  // if (user) {
  //   await syncUser();
  // }

  const posts: Post[] = [
    {
      id: 1,
      author: "alice",
      content: "Hi!",
      createdAt: "2025-04-13T18:45:00Z",
    },
    {
      id: 2,
      author: "bob",
      content: "I don't know javascript",
      createdAt: "2025-04-14T09:15:00Z",
    },
    {
      id: 3,
      author: "bob",
      content: "yay fashion",
      createdAt: "2025-04-14T09:15:00Z",
    },
    {
      id: 4,
      author: "alice",
      content: "Hi!",
      createdAt: "2025-04-13T18:45:00Z",
    },
    {
      id: 5,
      author: "bob",
      content: "I don't know javascript",
      createdAt: "2025-04-14T09:15:00Z",
    },
    {
      id: 6,
      author: "bob",
      content: "yay fashion",
      createdAt: "2025-04-14T09:15:00Z",
    },
    {
      id: 7,
      author: "alice",
      content: "Hi!",
      createdAt: "2025-04-13T18:45:00Z",
    },
    {
      id: 8,
      author: "bob",
      content: "I don't know javascript",
      createdAt: "2025-04-14T09:15:00Z",
    },
    {
      id: 9,
      author: "bob",
      content: "yay fashion",
      createdAt: "2025-04-14T09:15:00Z",
    },
    {
      id: 10,
      author: "alice",
      content: "Hi!",
      createdAt: "2025-04-13T18:45:00Z",
    },
    {
      id: 11,
      author: "bob",
      content: "I don't know javascript",
      createdAt: "2025-04-14T09:15:00Z",
    },
    {
      id: 12,
      author: "bob",
      content: "yay fashion",
      createdAt: "2025-04-14T09:15:00Z",
    },
  ];

  const user = await currentUser();

  if (user) {
    await syncUser();
  }

  return { posts };

}