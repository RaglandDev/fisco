export interface Comment {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
}

export async function getInternalUserId(clerkUserId: string){
  try {
    const res = await fetch(`/api/users/me?clerkUserId=${clerkUserId}`);
    if (!res.ok) throw new Error("Failed to fetch internal user ID");
    const data = await res.json();
    return data.internalUserId;
  } catch (error) {
    console.error("Error fetching internal user ID:", error);
    return null;
  }
};

export async function getComments(postId: string): Promise<Comment[]> {
  try {
    const res = await fetch(`/api/comments?postId=${postId}`);

    if (!res.ok) {
      console.error(`Failed to fetch comments: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("Expected an array of comments but received:", data);
      return [];
    }

    return data;
  } catch (err) {
    console.error("Error fetching comments:", err);
    return [];
  }
}
