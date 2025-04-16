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
      image: "https://www.beautybymissl.com/wp-content/uploads/2021/05/pale-pastel-yellow-and-black-outfit.jpg",    
      },
    {
      id: 2,
      author: "bob",
      content: "I don't know javascript",
      createdAt: "2025-04-14T09:15:00Z",
      image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
 
    },
    {
      id: 3,
      author: "bob",
      content: "yay fashion",
      createdAt: "2025-04-14T09:15:00Z",
      image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
 
    },
    {
      id: 4,
      author: "alice",
      content: "Hi!",
      createdAt: "2025-04-13T18:45:00Z",
      image: "https://www.beautybymissl.com/wp-content/uploads/2021/05/pale-pastel-yellow-and-black-outfit.jpg",
    },
    {
      id: 5,
      author: "bob",
      content: "I don't know javascript",
      createdAt: "2025-04-14T09:15:00Z",
      image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
 
    },
    {
      id: 6,
      author: "bob",
      content: "yay fashion",
      createdAt: "2025-04-14T09:15:00Z",
      image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
 
    },
    {
      id: 7,
      author: "alice",
      content: "Hi!",
      createdAt: "2025-04-13T18:45:00Z",
      image: "https://www.beautybymissl.com/wp-content/uploads/2021/05/pale-pastel-yellow-and-black-outfit.jpg",
    },
    {
      id: 8,
      author: "bob",
      content: "I don't know javascript",
      createdAt: "2025-04-14T09:15:00Z",
      image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
 
    },
    {
      id: 9,
      author: "bob",
      content: "yay fashion",
      createdAt: "2025-04-14T09:15:00Z",
      image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
 
    },
    {
      id: 10,
      author: "alice",
      content: "Hi!",
      createdAt: "2025-04-13T18:45:00Z",
      image: "https://www.beautybymissl.com/wp-content/uploads/2021/05/pale-pastel-yellow-and-black-outfit.jpg",
    },
    {
      id: 11,
      author: "bob",
      content: "I don't know javascript",
      createdAt: "2025-04-14T09:15:00Z",
      image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
 
    },
    {
      id: 12,
      author: "bob",
      content: "yay fashion",
      createdAt: "2025-04-14T09:15:00Z",
      image: "https://i.pinimg.com/736x/c7/69/2c/c7692c3a19bfa9d813b5bdbd9a41b210.jpg"
 
    },
  ];

  const user = await currentUser();

  if (user) {
    await syncUser();
  }

  return { posts };

}