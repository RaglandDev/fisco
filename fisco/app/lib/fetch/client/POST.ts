interface PostCommentParams {
  postId: string;
  clerkUserId: string | null | undefined;
  commentText: string;
}

export async function postComment({ postId, clerkUserId, commentText }: PostCommentParams): Promise<boolean> {
  try {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, clerkUserId, commentText }),
    });

    if (!res.ok) {
      console.error(`Failed to post comment: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Error posting comment:", err);
    return false;
  }
}
