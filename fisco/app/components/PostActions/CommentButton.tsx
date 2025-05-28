"use client";

import { MessageCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { Post } from "@/types/index";

interface CommentButtonProps {
  post: Post;
  onCommentClick: (postId: string) => void;
}

export default function CommentButton({ post, onCommentClick }: CommentButtonProps) {
  const { user } = useUser();
  const router = useRouter();

  const handleClick = () => {
    if (user) {
      onCommentClick(post.id);
    } else {
      router.push("/login");
    }
  };

  return (
    <button
      aria-label="Comment button"
      onClick={handleClick}
      className="flex flex-col items-center transition-transform duration-200 hover:scale-110"
    >
      <MessageCircle className="w-7 h-7 text-white transition-all duration-300 ease-in-out hover:text-blue-400" />
      <span className="text-white text-xs">{post.comment_count}</span>
    </button>
  );
}
