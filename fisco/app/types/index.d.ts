// global types go here
export type Tag = {
    x: number,
    y: number,
    label: string
}

export type Post = {
    id: string;
    fk_image_id: string;
    fk_author_id: string | "No Name Entered";
    created_at: Date; 
    likes: Array<string>;
    comments: Array<string>;
    saves: Array<string>;
    image_url: string;
    profile_image_url?: string | null;
    user_data?: string;
    first_name: string | "Unknown";
    last_name: string | "Unknown";
    email?: string;
    clerk_user_id?: string;
    comment_count: number;
    tags: Array<Tag>
};

export type Comment = {
  id: string;
  comment_text: string;
  created_at: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
}