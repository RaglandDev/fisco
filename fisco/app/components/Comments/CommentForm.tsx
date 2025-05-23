import React, { useState, FormEvent } from "react";
import { DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

import { commentFormStyles } from "@/components/Comments/styles";

interface CommentFormProps {
  onSubmit: (commentText: string) => Promise<boolean>;
  onError: (error: string | null) => void;
}

export function CommentForm({ onSubmit, onError }: CommentFormProps) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedComment = comment.trim();
    
    if (!trimmedComment) return;

    setIsSubmitting(true);
    onError(null);

    try {
      const success = await onSubmit(trimmedComment);
      
      if (success) {
        setComment("");
      } else {
        onError("Failed to post comment");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      onError("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={commentFormStyles.form}
      aria-label="Add comment"
    >
      <div className={commentFormStyles.inputContainer}>
        <input
          type="text"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment..."
          className={commentFormStyles.input}
          maxLength={200}
          disabled={isSubmitting}
          required
        />
        <span className={commentFormStyles.characterCount}>
          {comment.length}/200
        </span>
      </div>
      
      <DrawerFooter className={commentFormStyles.footer}>
        <Button 
          type="submit" 
          className={commentFormStyles.submitButton}
          disabled={isSubmitting || !comment.trim()}
        >
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </DrawerFooter>
    </form>
  );
}