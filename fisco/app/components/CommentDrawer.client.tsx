"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface CommentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
}

export default function CommentDrawer({ open, onOpenChange, postId }: CommentDrawerProps) {
  const [comment, setComment] = React.useState("");
  const { isSignedIn, isLoaded, userId: clerkUserId } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (open && isLoaded && !isSignedIn) {
      // Redirect to login and immediately close the drawer
      onOpenChange(false);
      router.push("/login");
    }
  }, [open, isSignedIn, isLoaded, router, onOpenChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting comment:", { postId, clerkUserId, comment });
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
      onOpenChange(false);
    } catch (err) {
      alert("Failed to post comment");
    }
  };

  // Don’t render the drawer content if not signed in
  if (!isSignedIn) return null;

  return (
    <Drawer  open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="flex flex-col items-center">
          <DrawerTitle>Comments</DrawerTitle>
        </DrawerHeader>
        <form aria-label="Comment form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
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
            <Button type="submit" className="w-full">Submit</Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}