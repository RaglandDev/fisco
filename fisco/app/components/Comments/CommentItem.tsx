import React from "react";
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

import type { Comment } from "@/types/index"
import { commentItemStyles } from "@/components/Comments/styles"
import { formatRelativeTime } from "@/lib/utils"

interface CommentItemProps {
  commentData: Comment
  isOwner: boolean | null | string
  onDelete: () => void
}

export default function CommentItem({ commentData, isOwner, onDelete }: CommentItemProps) {
  const relativeTimeStamp = (created: string) => {
    const formatted = formatRelativeTime(created)
    if (formatted) {
      return formatted
    }

    return "Invalid date"
  }
  return (
    <div className={commentItemStyles.container}>
      <div className={commentItemStyles.meta}>
        <span className={commentItemStyles.username}>@ Username</span>
        <span className={commentItemStyles.separator}>•</span>
        <span className={commentItemStyles.timestamp}>{relativeTimeStamp(commentData.created_at)}</span>
      </div>

      <p className={commentItemStyles.content}>{commentData.comment_text}</p>

      {isOwner && (
        <div className={commentItemStyles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className={commentItemStyles.deleteButton}
            aria-label="Delete comment"
          >
            <Trash2 className={commentItemStyles.deleteIcon} />
          </Button>
        </div>
      )}
    </div>
  )
}
