export type Post = {
    id: string;
    fk_image_id: string;
    fk_author_id: string;
    created_at: Date; 
    likes: Array<number>;
    comments: Array<string>;
};