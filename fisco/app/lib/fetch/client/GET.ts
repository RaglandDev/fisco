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
