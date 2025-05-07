"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface CommentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommentDrawer({ open, onOpenChange }: CommentDrawerProps) {
  const [comment, setComment] = React.useState("");
  const { isSignedIn, isLoaded } = useAuth();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setComment("");
    onOpenChange(false);
  };

  // Don’t render the drawer content if not signed in
  if (!isSignedIn) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="flex flex-col items-center">
          <DrawerTitle>Comments</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
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