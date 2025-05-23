import * as React from "react";
import { useEffect, useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { CommentList } from "@/components/Comments/CommentList";
import { CommentForm } from "@/components/Comments/CommentForm";
import { CommentError } from "@/components/Comments/CommentError";
import { type Comment } from "@/types/index";
import { getInternalUserId, getComments } from "@/lib/fetch/client/GET";
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalUserId, setInternalUserId] = useState<string | null>(null);
  
  const { isSignedIn, isLoaded, userId: clerkUserId } = useAuth();
  const router = useRouter();

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
    if (!postId) return;
    
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
  }, [postId, setCommentCount]);

  // Handle comment submission
  const handleSubmitComment = async (commentText: string): Promise<boolean> => {
    if (!clerkUserId) return false;

    try {
      const success = await postComment({ 
        postId, 
        clerkUserId, 
        commentText 
      });
      
      if (success) {
        onCommentChanged?.();
        await fetchComments();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error posting comment:", err);
      throw err;
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: string) => {
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

  // Handle authentication redirect
  useEffect(() => {
    if (open && isLoaded && !isSignedIn) {
      onOpenChange(false);
      router.push("/login");
    }
  }, [open, isSignedIn, isLoaded, router, onOpenChange]);

  // Fetch comments when drawer opens
  useEffect(() => {
    if (open) {
      fetchComments();
    }
  }, [open, fetchComments]);

  // Reset error when drawer closes
  useEffect(() => {
    if (!open) {
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

        <CommentError error={error} />

        <CommentList
          comments={comments}
          isLoading={isLoading}
          internalUserId={internalUserId}
          onDeleteComment={handleDeleteComment}
        />

        <CommentForm
          onSubmit={handleSubmitComment}
          onError={setError}
        />
      </DrawerContent>
    </Drawer>
  );
}