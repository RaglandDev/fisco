"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { Post } from "@/types/index";

interface LikeButtonProps {
  post: Post;
  onLikeChange: (updatedPost: Post) => void;
}

export default function LikeButton({ post, onLikeChange }: LikeButtonProps) {
  const { user } = useUser();
  const router = useRouter();
  const [likeInProgress, setLikeInProgress] = useState<boolean>(false);

  const handleLike = async () => {
    // If user is not signed in
    if (!user) {
      alert("Please sign in to like posts!");
      router.push("/login");
      return;
    }

    // Prevent multiple requests
    if (likeInProgress) {
      return;
    }

    // Lock so there's only a single request
    setLikeInProgress(true);

    const userId = user.id;
    const hasLiked = post.likes.includes(user?.id);

    // Optimistically update UI immediately
    const updatedPost = {
      ...post,
      likes: hasLiked
        ? post.likes.filter((id) => id !== userId)
        : [...post.likes, userId],
    };
    
    onLikeChange(updatedPost);

    // Make an API call to update the likes array for the post
    try {
      // Determines whether to like/remove like from the post
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/testendpoint`, {
        method: hasLiked ? "DELETE" : "POST",
        body: JSON.stringify({ post_id: post.id, userId }), // send ID in body, not path
      });
    } catch (error) {
      console.error("Error liking post:", error);
      // Revert the optimistic update if the API call fails
      onLikeChange({
        ...post,
        likes: hasLiked
          ? [...post.likes, userId]
          : post.likes.filter((id) => id !== userId),
      });
    } finally {
      // Unlock
      setLikeInProgress(false);
    }
  };

  return (
    <button
      aria-label="Like button"
      onClick={handleLike}
      className="flex flex-col items-center transition-transform duration-200 hover:scale-110"
    >
      <Heart
        className={`w-7 h-7 transition-all duration-300 ease-in-out ${
          user?.id && post.likes.includes(user.id)
            ? "text-red-500 fill-red-500 scale-110"
            : "text-white"
        }`}
      />
      <span aria-label="Like count" className="text-white text-xs">{post.likes.length}</span>
    </button>
  );
}
