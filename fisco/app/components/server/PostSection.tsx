// Server-rendered post section hmm
export function PostSection({ post }: { post: Post }) {
    const mimeType = post.image_data.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    return (
      <section className="post-snap">
        <div className="post-card">
              <p className="post-author">@{post.first_name ?? post.email ?? "Unknown Name"}</p>
              <img src={`data:${mimeType};base64,${post.image_data}`} alt="Fisco" className="post-image" />
              <p className="post-date">{new Date(post.created_at).toLocaleString()}</p>
              <p className="post-likes">Liked by: {post.likes}</p>
              <p className="post-comments">Comments: {post.comments}</p>
            </div>
      </section>
    );
}
