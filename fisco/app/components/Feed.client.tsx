"use client"

import { useState, useRef, useEffect } from "react"
import CommentDrawer from "@/components/Comments/CommentDrawer"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { User, Loader2 } from "lucide-react"
import type { Post } from "@/types/index"
import { useSearchParams } from "next/navigation";
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils"

// Import action button components
import {
  LikeButton,
  CommentButton,
  SaveButton,
  DeleteButton,
  TagButton,
  TagsDisplay
} from "@/components/PostActions"

// Helper function has been moved to TagsDisplay.tsx


const POSTS_PER_PAGE = 5

export default function Feed({ postData, offset }: { postData: Post[]; offset: number }) {
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>(postData)

  // Check if the posts are still loading
  const [loading, setLoading] = useState(true)

  // Store the database UUID for the current user
  const [userUUID, setUserUUID] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  const [currentPostIndex, setCurrentPostIndex] = useState(0) // how deep into the feed you are

  const [tagsVisible, setTagsVisible] = useState(false)
    
  // If there are no posts in the database
  if (posts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white">No posts available...</p>
      </div>
    )
  }

  const fetchMorePosts = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/testendpoint?limit=${POSTS_PER_PAGE}&offset=${offset + posts.length}`,
      )
      const data = await res.json()
      
      const newPosts: Post[] = data.posts
      if (newPosts) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const filteredNewPosts = newPosts.filter((p) => !existingIds.has(p.id))
          return [...prev, ...filteredNewPosts]
        })
      }
    } catch (error) {
      console.error("Failed to fetch more posts", error)
    }
  }

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop
      const containerHeight = containerRef.current.clientHeight
      const newIndex = Math.round(scrollTop / containerHeight)
      setCurrentPostIndex(newIndex)
      setTagsVisible(false)
    }
  }

  const fetchMorePostsRef = useRef(fetchMorePosts)
  fetchMorePostsRef.current = fetchMorePosts

  useEffect(() => {
    const loadMorePosts = async () => {
      if (currentPostIndex === posts.length - 4) {
        // loads posts in advance (instead of at the bottom)
        await fetchMorePostsRef.current()
      }
    }

    loadMorePosts()
  }, [currentPostIndex, posts.length])

  const { user } = useUser()

  // Fetch the user's database UUID when logged in
  useEffect(() => {
    const fetchUserUUID = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me?clerkUserId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.internalUserId) {
              setUserUUID(data.internalUserId)
            }
          }
        } catch (error) {
          console.error("Error fetching user DB ID:", error)
        }
      }
    }

    fetchUserUUID()
  }, [user?.id])

  const searchParams = useSearchParams();
  const postId = searchParams.get("postId");

  useEffect(() => {
    if (!postId || !containerRef.current) return;

    const index = posts.findIndex(post => post.id === postId);
    if (index !== -1) {
      const container = containerRef.current;
      const postHeight = container.clientHeight;
      container.scrollTo({
        top: postHeight * index,
        behavior: "smooth",
      });
    }
  }, [posts, postId]);

  return (
    <div
      className="w-[100dvw] h-[100dvh] md:w-[100dwh] md:h-[100dvh] md:my-4 md:rounded-xl overflow-hidden bg-black shadow-2xl relative"
      aria-label="Feed window"
      style={{ touchAction: "pan-y", overscrollBehavior: "none" }}
    >
      <div className="w-full h-full relative">
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-auto snap-y snap-mandatory"
          style={{ scrollbarWidth: "none", touchAction: "pan-y", overscrollBehavior: "none" }}
          onScroll={handleScroll}
        >
        
          {posts.map((post, index) => (
            <div key={post.id} className="relative h-full w-full snap-start snap-alway">
              {/* Post content remains the same */}

              {/* Loading symbol if post doesn't load */}
              <div className="relative w-full h-full">
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  </div>
                )}

                <div className="absolute inset-0">
                  <Image
                    data-testid="Post image"
                    src={`${post.image_url}`}
                    alt={`${post.first_name}'s post image`}
                    fill
                    className={`object-contain transition-opacity duration-300 ${loading ? "opacity-0" : "opacity-100"}`}
                    onLoad={() => setLoading(false)}
                    priority={index <= 1}
                  />
                </div>

                {/* Render tags if they exist with fade transition */}
                {post.tags && (
                  <TagsDisplay tags={post.tags} visible={tagsVisible} />
                )}
              </div>
            

              {/* Gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />

              {/* Bottom bar with user info and actions */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end p-4 z-10">
                {/* User info and caption */}
                <div className="flex-1 text-white mr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
                      {post.profile_image_url ? (
                        <Image
                          src={post.profile_image_url}
                          alt={`${post.first_name}'s profile picture`}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400 m-auto" />
                      )}
                    </div>
                    <div className="flex items-center">
                      {/* Profile Button with Conditional Redirect */}
                      <Link href={user ? `/profile/${post.clerk_user_id}` : "/login"}>
                        <button className="font-semibold text-white bg-transparent border-none cursor-pointer">
                          @{post.first_name || "Unknown"} {post.last_name || "User"}
                        </button>
                      </Link>
                      {/* Bullet separator and timestamp */}
                      <span className="text-gray-400 mx-2">•</span>
                      <span className="text-gray-400 text-sm">{formatRelativeTime(post.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3 items-center">:
                  <LikeButton 
                    post={post} 
                    onLikeChange={(updatedPost) => {
                      setPosts((prevPosts) =>
                        prevPosts.map((p) => p.id === updatedPost.id ? updatedPost : p)
                      )
                    }}
                  />
                  
                  <CommentButton 
                    post={post} 
                    onCommentClick={(postId) => setActiveCommentPostId(postId)} 
                  />

                  {activeCommentPostId === post.id && (
                    <CommentDrawer
                      open={true}
                      onOpenChange={() => setActiveCommentPostId(null)}
                      postId={post.id}
                      onCommentChanged={() => {
                        setPosts((prev) =>
                          prev.map((p) =>
                            p.id === post.id
                              ? {
                                ...p,
                                comment_count: Math.max(0, (p.comment_count || 0) - 1 + 2),
                              }
                              : p,
                          ),
                        )
                      }}
                    />
                  )}
                  
                  <SaveButton 
                    post={post} 
                    onSaveChange={(updatedPost) => {
                      setPosts((prevPosts) =>
                        prevPosts.map((p) => p.id === updatedPost.id ? updatedPost : p)
                      )
                    }}
                  />
                  
                  <DeleteButton 
                    post={post} 
                    userUUID={userUUID} 
                    onPostDeleted={(postId) => {
                      setPosts((posts) => posts.filter((p) => p.id !== postId));
                    }} 
                  />
                  
                  <TagButton 
                    tagsVisible={tagsVisible} 
                    onToggleTags={() => setTagsVisible(!tagsVisible)} 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
    ::-webkit-scrollbar {
      display: none;
    }
    
    /* Prevent horizontal scrolling/swiping */
    body, html {
      overscroll-behavior-x: none;
      overflow-x: hidden;
    }
  `}</style>
    </div>
  )
}
