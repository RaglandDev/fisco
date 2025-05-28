"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { Post } from "@/types";

interface SaveButtonProps {
  post: Post;
  onSaveChange: (updatedPost: Post) => void;
}

export default function SaveButton({ post, onSaveChange }: SaveButtonProps) {
  const { user } = useUser();
  const router = useRouter();
  const [saveInProgress, setSaveInProgress] = useState<boolean>(false);

  const handleSave = async () => {
    // If user is not signed in
    if (!user) {
      alert("Please sign in to save posts!");
      router.push("/login");
      return;
    }

    // Prevent multiple requests
    if (saveInProgress) {
      return;
    }

    // Lock so there's only a single request
    setSaveInProgress(true);

    const userId = user.id;
    const hasSaved = post.saves.includes(user?.id);

    // Optimistically update UI immediately
    const updatedPost = {
      ...post,
      saves: hasSaved
        ? post.saves.filter((id) => id !== userId)
        : [...post.saves, userId],
    };
    
    onSaveChange(updatedPost);

    // Make an API call to update the saves array for the post
    try {
      // Determines whether to save/remove save from the post
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
        method: hasSaved ? "DELETE" : "POST",
        body: JSON.stringify({ post_id: post.id, userId }), // send ID in body, not path
      });
    } catch (error) {
      console.error("Error saving post:", error);
      // Revert the optimistic update if the API call fails
      onSaveChange({
        ...post,
        saves: hasSaved
          ? [...post.saves, userId]
          : post.saves.filter((id) => id !== userId),
      });
    } finally {
      // Unlock
      setSaveInProgress(false);
    }
  };

  return (
    <button
      aria-label="Save button"
      onClick={handleSave}
      className="flex flex-col items-center transition-transform duration-200 hover:scale-110"
    >
      <Bookmark
        className={`w-7 h-7 transition-all duration-300 ease-in-out ${
          user?.id && post.saves.includes(user.id)
            ? "text-yellow-500 fill-yellow-500 scale-110"
            : "text-white"
        }`}
      />
    </button>
  );
}
