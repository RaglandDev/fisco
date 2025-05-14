// global types go here

export type Post = {
    id: string;
    fk_image_id: string;
    fk_author_id: string | "No Name Entered";
    created_at: Date; 
    likes: Array<string>;
    comments: Array<string>;
    saves: Array<string>;
    image_data: string;
    user_data?: string;
    first_name: string | "Unknown";
    last_name: string | "Unknown";
    email?: string;
    comment_count: number;
};