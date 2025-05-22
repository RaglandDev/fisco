import { type Comment } from "@/types/index"

interface CommentItemProps {
  commentData: Comment;
  isOwner: boolean | null | string;
  onDelete: () => void;
}

export default function CommentItem({ commentData, isOwner, onDelete }: CommentItemProps) {
  return (
    <div className="border-b border-gray-100 pb-3 last:border-b-0">
      <p className="text-sm leading-relaxed mb-2">{commentData.comment_text}</p>
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {new Date(commentData.created_at).toLocaleString()}
        </p>
        
        {isOwner && (
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}