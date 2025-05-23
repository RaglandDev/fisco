import React from "react";

import CommentItem from "@/components/Comments/CommentItem";
import { type Comment } from "@/types/index";
import { commentListStyles } from "@/components/Comments/styles";

interface CommentListProps {
  comments: Comment[];
  isLoading: boolean;
  internalUserId: string | null;
  onDeleteComment: (commentId: string) => Promise<void>;
}

export function CommentList({
  comments,
  isLoading,
  internalUserId,
  onDeleteComment,
}: CommentListProps) {
  if (isLoading) {
    return (
      <div className={commentListStyles.loadingContainer}>
        <p className={commentListStyles.loadingText}>Loading comments...</p>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={commentListStyles.emptyContainer}>
        <p className={commentListStyles.emptyText}>No comments yet.</p>
        <p className={commentListStyles.emptySubtext}>Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className={commentListStyles.container}>
      <div className={commentListStyles.commentsWrapper}>
        {comments.map((c) => {
          const isOwner = internalUserId && 
            String(c.user_id) === String(internalUserId);

          return (
            <CommentItem
              key={c.id}
              commentData={c}
              isOwner={isOwner}
              onDelete={() => onDeleteComment(c.id)}
            />
          );
        })}
      </div>
    </div>
  );
}