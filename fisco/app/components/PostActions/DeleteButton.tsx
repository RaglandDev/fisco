"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import type { Post } from "@/types/index";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface DeleteButtonProps {
  post: Post;
  userUUID: string | null;
  onPostDeleted: (postId: string) => void;
}

export default function DeleteButton({ post, userUUID, onPostDeleted }: DeleteButtonProps) {
  const { user } = useUser();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Only show delete button if the user is the author of the post
  if (!user?.id || !userUUID || post.fk_author_id !== userUUID) {
    return null;
  }

  const handleDelete = async () => {
    try {
      const res = await fetch("/api/posts", {
        method: "DELETE",
        body: JSON.stringify({ postId: post.id }),
      });
      if (res.ok) {
        onPostDeleted(post.id);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete post");
      }
    } catch (_err) {
      alert("Failed to delete post");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <button
        aria-label="Delete button"
        onClick={() => {
          console.log("Delete button clicked for post:", post.id);
          setDeleteDialogOpen(true);
        }}
        className="flex flex-col items-center mt-3 transition-transform duration-200 hover:scale-110"
      >
        <Trash2 className="w-7 h-7 text-white hover:text-red-500 transition-all duration-300 ease-in-out" />
      </button>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-black text-white border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Post</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white border border-gray-700"
              aria-label="Confirm deletion"
              data-testid="alert-dialog-action"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
