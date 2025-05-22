export async function deleteComment(commentId: string, clerkUserId: string | null | undefined): Promise<boolean> {
  try {
    const res = await fetch(`/api/comments?id=${commentId}&clerkUserId=${clerkUserId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      console.error(`Failed to delete comment: ${res.status} ${res.statusText}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    return false;
  }
}
