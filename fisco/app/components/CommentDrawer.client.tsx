"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
}

interface CommentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onCommentChanged?: () => void;
  setCommentCount?: (count: number) => void; // ✅ new
}

export default function CommentDrawer({
  open,
  onOpenChange,
  postId,
  onCommentChanged,
  setCommentCount,
}: CommentDrawerProps) {
  const [comment, setComment] = React.useState("");
  const [comments, setComments] = React.useState<Comment[] | null>(null);
  const [internalUserId, setInternalUserId] = React.useState<string | null>(null);
  const { isSignedIn, isLoaded, userId: clerkUserId } = useAuth();
  const router = useRouter();

  // Redirect to login if not signed in
  React.useEffect(() => {
    if (open && isLoaded && !isSignedIn) {
      onOpenChange(false);
      router.push("/login");
    }
  }, [open, isSignedIn, isLoaded, router, onOpenChange]);

  // Get internal user ID from backend
  React.useEffect(() => {
    const getInternalUserId = async () => {
      if (clerkUserId) {
        const res = await fetch(`/api/users/me?clerkUserId=${clerkUserId}`);
        const data = await res.json();
        setInternalUserId(data.internalUserId);
      }
    };
    getInternalUserId();
  }, [clerkUserId]);

  // Fetch all comments
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments?postId=${postId}`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setComments(data);
        if (setCommentCount) setCommentCount(data.length); // ✅ update count
      } else {
        console.error("Expected array, got:", data);
        setComments([]);
        if (setCommentCount) setCommentCount(0);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setComments([]);
      if (setCommentCount) setCommentCount(0);
    }
  };

  // Delete a comment
  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await fetch(`/api/comments?id=${commentId}&clerkUserId=${clerkUserId}`, {
        method: "DELETE",
      });
      await fetchComments(); // ✅ re-sync count
    } catch (err) {
      console.error(err);
      alert("Failed to delete comment");
    }
  };

  // Fetch on drawer open
  React.useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [open, postId]);

  // Update comment input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  // Submit a comment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          clerkUserId,
          commentText: comment,
        }),
      });

      setComment("");
      if (onCommentChanged) onCommentChanged();
      await fetchComments(); // ✅ re-sync count
    } catch (err) {
      console.error(err);
      alert("Failed to post comment");
    }
  };

  if (!isSignedIn) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="flex flex-col items-center">
          <DrawerTitle>Comments</DrawerTitle>
        </DrawerHeader>

        <div className="p-4 max-h-[300px] overflow-y-auto">
          {comments ? (
            comments.length > 0 ? (
              comments.map((c) => {
                const isOwner =
                  internalUserId && String(c.user_id) === String(internalUserId);

                return (
                  <div key={c.id} className="mb-3 border-b pb-2">
                    <p className="text-sm">{c.comment_text}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleString()}
                    </p>

                    {isOwner && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-xs text-red-500 mt-1 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No comments yet.</p>
            )
          ) : (
            <p className="text-sm text-gray-500">Loading comments...</p>
          )}
        </div>

        <form
          aria-label="Comment form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-4"
        >
          <input
            type="text"
            value={comment}
            onChange={handleInputChange}
            placeholder="Leave a comment..."
            className="border rounded p-2 w-full"
            maxLength={200}
            required
          />
          <DrawerFooter>
            <Button type="submit" className="w-full">
              Submit
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
