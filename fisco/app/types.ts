export interface PostTag {
  x: number;
  y: number;
  label?: string;
}

export interface Post {
  id: string;
  image_url: string;
  fk_author_id: string;
  clerk_user_id: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  created_at: string;
  likes: string[];
  saves: string[];
  comment_count: number;
  tags?: PostTag[];
}
