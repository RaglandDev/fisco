"use client";

import * as React from "react";
import { useEffect, useCallback, FormEvent } from "react";
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

import CommentItem from "@/components/CommentItem.client";
import { getInternalUserId, getComments } from "@/lib/fetch/client/GET";
import { type Comment } from "@/types/index"
import { deleteComment } from "@/lib/fetch/client/DELETE";
import { postComment } from "@/lib/fetch/client/POST";

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
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [internalUserId, setInternalUserId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  
  const { isSignedIn, isLoaded, userId: clerkUserId } = useAuth();
  const router = useRouter();

  // Handle authentication redirect
  useEffect(() => {
    if (open && isLoaded && !isSignedIn) {
      onOpenChange(false);
      router.push("/login");
    }
  }, [open, isSignedIn, isLoaded, router, onOpenChange]);

  // Get internal user ID
  useEffect(() => {
    const fetchInternalUserId = async () => {
      if (clerkUserId) {
        try {
          const id = await getInternalUserId(clerkUserId);
          setInternalUserId(id);
        } catch (err) {
          console.error("Failed to get internal user ID:", err);
        }
      }
    };
    fetchInternalUserId();
  }, [clerkUserId]);

  // Fetch comments with better error handling
  const fetchComments = useCallback(async () => {
    if (!postId || !open) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getComments(postId);
      setComments(data || []);
      setCommentCount?.(data?.length || 0);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments");
      setComments([]);
      setCommentCount?.(0);
    } finally {
      setIsLoading(false);
    }
  }, [postId, open, setCommentCount]);

  // Fetch comments when drawer opens
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle comment submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedComment = comment.trim();
    
    if (!trimmedComment || !clerkUserId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await postComment({ 
        postId, 
        clerkUserId, 
        commentText: trimmedComment 
      });
      
      if (success) {
        setComment("");
        onCommentChanged?.();
        await fetchComments();
      } else {
        setError("Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const success = await deleteComment(commentId, clerkUserId);
      if (success) {
        await fetchComments();
      } else {
        setError("Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
    }
  };

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setComment("");
      setError(null);
    }
  }, [open]);

  if (!isSignedIn || !isLoaded) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="flex flex-col items-center">
          <DrawerTitle>Comments</DrawerTitle>
        </DrawerHeader>

        {error && (
          <div className="mx-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="p-4 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <p className="text-sm text-gray-500">Loading comments...</p>
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((c) => {
                const isOwner = internalUserId && 
                  String(c.user_id) === String(internalUserId);

                return (
                  <CommentItem
                    key={c.id}
                    commentData={c}
                    isOwner={isOwner}
                    onDelete={() => handleDelete(c.id)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No comments yet.</p>
              <p className="text-xs text-gray-400 mt-1">Be the first to comment!</p>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-4 border-t"
          aria-label="Add comment"
        >
          <div className="relative">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment..."
              className="border rounded-md p-3 w-full pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
              disabled={isSubmitting}
              required
            />
            <span className="absolute right-3 top-3 text-xs text-gray-400">
              {comment.length}/200
            </span>
          </div>
          
          <DrawerFooter className="px-0 pt-0">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? "Posting..." : "Post Comment"}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}