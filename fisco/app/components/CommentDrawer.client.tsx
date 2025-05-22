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
import { getInternalUserId, getComments } from "@/lib/fetch/client/GET";
import { deleteComment } from "@/lib/fetch/client/DELETE";
import { postComment } from "@/lib/fetch/client/POST";

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
  setCommentCount?: (count: number) => void;
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

    React.useEffect(() => {
      const getId = async () => {
        if (clerkUserId) {
          const id = await getInternalUserId(clerkUserId);
          if (id) {
            setInternalUserId(id);
          }
        }
      };
      getId();
    }, [clerkUserId]);

const fetchComments = async () => {
  try {
    const data = await getComments(postId);

    if (data.length) {
      setComments(data);
      if (setCommentCount) setCommentCount(data.length);
    } else {
      setComments([]);
      if (setCommentCount) setCommentCount(0);
    }
  } catch (err) {
    console.error("Error fetching comments:", err);
    setComments([]);
    if (setCommentCount) setCommentCount(0);
  }
};

const handleDelete = async (commentId: string) => {
  if (!confirm("Are you sure you want to delete this comment?")) return;

  try {
    const success = await deleteComment(commentId, clerkUserId);
    if (success) {
      await fetchComments();
    } else {
      alert("Failed to delete comment");
    }
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

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!comment.trim()) return;

  try {
    const success = await postComment({ postId, clerkUserId, commentText: comment });
    if (success) {
      setComment("");
      if (onCommentChanged) onCommentChanged();
      await fetchComments();
    } else {
      alert("Failed to post comment");
    }
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
