"use client"

import { useState, useRef, useEffect } from "react"
import CommentDrawer from "@/components/Comments/CommentDrawer"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import Image from "next/image"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Heart, MessageCircle, User, Bookmark, Trash2, Tag } from "lucide-react"
import type { Post } from "@/types"
import { useSearchParams } from "next/navigation";
import Link from "next/link"
import { formatRelativeTime } from "@/lib/utils"

// Helper function to determine label position based on pin position
const getLabelPosition = (x: number, y: number) => {
  // Threshold values for edges (as percentage)
  const topThreshold = 0.15 // 15% from top
  const leftThreshold = 0.15 // 15% from left
  const rightThreshold = 0.85 // 15% from right

  // Default position (above the pin)
  const position = {
    top: "-top-10",
    left: "left-1/2",
    transform: "-translate-x-1/2",
    origin: "",
  }

  // If pin is near the top, place label below
  if (y < topThreshold) {
    position.top = "top-10"
  }

  // If pin is near the left edge, align label to start from pin
  if (x < leftThreshold) {
    position.left = "left-0"
    position.transform = "translate-x-0"
    position.origin = "origin-left"
  }

  // If pin is near the right edge, align label to end at pin
  if (x > rightThreshold) {
    position.left = "right-0"
    position.transform = "translate-x-0"
    position.origin = "origin-right"
  }

  return position
}

<<<<<<< HEAD
=======
// Helper: parse an ISO‐like timestamp *as UTC* even if it has no "Z"  
function parseAsUTC(dateString: string): Date {
  // Pull out the date‐time components  
  const m = dateString.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?$/
  );
  if (!m) return new Date(dateString); // fallback to default parsing  

  const [, Y, Mo, D, h, mnt, s] = m.map(Number);
  // Date.UTC interprets args as UTC  
  return new Date(Date.UTC(Y, Mo - 1, D, h, mnt, s));
}

function convertUTCDateToLocalDate(date: Date) {
  const newDate = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);

  const offset = date.getTimezoneOffset() / 60;
  const hours = date.getHours();

  newDate.setHours(hours - offset);

  return newDate;
}

export const formatRelativeTime = (dateString: string | Date) => {
  // 1) Turn strings into UTC‐based Date objects  
  const date =
    typeof dateString === "string"
      ? parseAsUTC(dateString)
      : dateString;

  const now = new Date();
  const diffMs = now.getTime() - convertUTCDateToLocalDate(date).getTime();

  // 2) Break down into units  
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);
  const diffWeeks = Math.floor(diffDays / 7);

  // 3) Format  
  if (diffMinutes < 1) return `Just now`;
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return `${diffWeeks}w`;
}

>>>>>>> cea69f9eb21f0f7b3f4632333afad6f35306cbf3

const POSTS_PER_PAGE = 5

export default function Feed({ postData, offset }: { postData: Post[]; offset: number }) {
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>(postData)
  // Lock for liking posts
  const [likeInProgress, setLikeInProgress] = useState<string | null>(null)

  // Lock for saving posts
  const [saveInProgress, setSaveInProgress] = useState<string | null>(null)

  // Store the database UUID for the current user
  const [userUUID, setUserUUID] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)

  const [currentPostIndex, setCurrentPostIndex] = useState(0) // how deep into the feed you are

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)

  const [tagsVisible, setTagsVisible] = useState(false)

  const handleDelete = (postId: string) => {
    console.log("Delete button clicked for post:", postId)
    setPostToDelete(postId)
    setDeleteDialogOpen(true)
    setTimeout(() => {
      console.log("deleteDialogOpen after click:", deleteDialogOpen)
    }, 100)
  }

  const router = useRouter()

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

  const handleLike = async (post_id: string) => {
    // If user is not signed in
    if (!user) {
      alert("Please sign in to like posts!")
      return
    }
    // Prohibits the user from liking the same post multiple times
    if (likeInProgress === post_id) {
      return
    }

    // Lock so there's only a single request
    setLikeInProgress(post_id)

    const userId = user.id
    const post = posts.find((p) => p.id === post_id)
    if (!post) {
      setLikeInProgress(null)
      return
    }

    const hasLiked = post.likes.includes(user?.id)

    // Optimistically update UI immediately
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === post_id) {
          if (hasLiked) {
            // Remove the user ID from the likes array
            return {
              ...post,
              likes: post.likes.filter((id) => id !== userId),
            }
          } else {
            // Add the user ID to the likes array
            return {
              ...post,
              likes: [...post.likes, userId],
            }
          }
        } else {
          // Return the post unchanged
          return post
        }
      }),
    )

    // Make an API call to update the likes array for the post
    try {
      // Determines whether to like/remove like from the post
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/testendpoint`, {
        method: hasLiked ? "DELETE" : "POST",
        body: JSON.stringify({ post_id, userId }), // send ID in body, not path
      })
    } catch (error) {
      console.error("Error liking post:", error)
      // Revert the optimistic update if the API call fails
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === post_id) {
            if (!hasLiked) {
              // Remove the user ID from the likes array
              return {
                ...post,
                likes: post.likes.filter((id) => id !== userId),
              }
            } else {
              // Add the user ID back to the likes array
              return {
                ...post,
                likes: [...post.likes, userId],
              }
            }
          } else {
            // Return the post unchanged
            return post
          }
        }),
      )
    } finally {
      // Unlock
      setLikeInProgress(null)
    }
  }
  const handleSave = async (post_id: string) => {
    // If user is not signed in
    if (!user) {
      alert("Please sign in to save posts!")
      return
    }
    // Prohibits the user from saving the same post multiple times
    if (saveInProgress === post_id) {
      return
    }

    // Lock so there's only a single request
    setSaveInProgress(post_id)

    const userId = user.id
    const post = posts.find((p) => p.id === post_id)
    if (!post) {
      setSaveInProgress(null)
      return
    }

    const hasSaved = post.saves.includes(user?.id)

    // Optimistically update UI immediately
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id === post_id) {
          if (hasSaved) {
            // Remove the user ID from the saves array
            return {
              ...post,
              saves: post.saves.filter((id) => id !== userId),
            }
          } else {
            // Add the user ID to the saves array
            return {
              ...post,
              saves: [...post.saves, userId],
            }
          }
        } else {
          // Return the post unchanged
          return post
        }
      }),
    )

    // Make an API call to update the saves array for the post
    try {
      // Determines whether to save/remove save from the post
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
        method: hasSaved ? "DELETE" : "POST",
        body: JSON.stringify({ post_id, userId }), // send ID in body, not path
      })
    } catch (error) {
      console.error("Error saving post:", error)
      // Revert the optimistic update if the API call fails
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === post_id) {
            if (!hasSaved) {
              // Remove the user ID from the saves array
              return {
                ...post,
                saves: post.saves.filter((id) => id !== userId),
              }
            } else {
              // Add the user ID back to the saves array
              return {
                ...post,
                saves: [...post.saves, userId],
              }
            }
          } else {
            // Return the post unchanged
            return post
          }
        }),
      )
    } finally {
      // Unlock
      setSaveInProgress(null)
    }
  }

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
              <div className="absolute inset-0">
                <Image
                  data-testid="Post image"
                  src={
                    `${post.image_url}` ||
                    "/placeholder.svg"
                  }
                  alt={"alt"}
                  fill
                  className="object-contain"
                  priority={index <= 1}
                />

                {/* Render tags if they exist with fade transition */}
                {post.tags && (
                  <>
                    {(() => {
                      try {
                        // Parse the tag data

                        return post.tags.map((tag, tagIndex) => {
                          // Get dynamic position for label based on tag position
                          const labelPosition = getLabelPosition(tag.x, tag.y)

                          return (
                            <div
                              id={`post tag ${tagIndex}`}
                              key={tagIndex}
                              className={`absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ease-in-out ${tagsVisible ? "opacity-100" : "opacity-0"}`}
                              style={{
                                left: `${tag.x * 100}%`,
                                top: `${tag.y * 100}%`,
                                pointerEvents: tagsVisible ? "auto" : "none",
                              }}
                            >
                              <div className="flex items-center justify-center">
                                <Tag className="h-6 w-6 text-red-500 fill-red-500/50" />
                              </div>

                              {/* tag label */}
                              {tag.label && (
                                <div
                                  className={`absolute ${labelPosition.top} ${labelPosition.left} ${labelPosition.origin} transform ${labelPosition.transform} bg-black text-white text-xs px-2 py-1 rounded-md whitespace-nowrap z-30`}
                                >
                                  {tag.label}
                                </div>
                              )}
                            </div>
                          )
                        })
                      } catch (e) {
                        console.error("Error parsing tag data:", e)
                        return null
                      }
                    })()}
                  </>
                )}
              </div>

              {/* Gradient overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />

              {/* Bottom bar with user info and actions */}
              <div className="absolute bottom-0 left-0 right-0 flex items-end p-4 z-10">
                {/* User info and caption */}
                <div className="flex-1 text-white mr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex items-center">
                      {/* Profile Button with Conditional Redirect */}
                      <Link href={user ? "/profile" : "/login"}>
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
                <div className="flex flex-col gap-3 items-center">
                  <button
                    aria-label="Like button"
                    onClick={() => {
                      if (user) {
                        handleLike(post.id)
                      } else {
                        router.push("/login")
                      }
                    }}
                    className="flex flex-col items-center transition-transform duration-200 hover:scale-110"
                  >
                    <Heart
                      className={`w-7 h-7 transition-all duration-300 ease-in-out ${user?.id && post.likes.includes(user.id) ? "text-red-500 fill-red-500 scale-110" : "text-white"
                        }`}
                    />
                    <span className="text-white text-xs">{post.likes.length}</span>
                  </button>
                  <button
                    aria-label="Comment button"
                    onClick={() => setActiveCommentPostId(post.id)}
                    className="flex flex-col items-center transition-transform duration-200 hover:scale-110"
                  >
                    <MessageCircle className="w-7 h-7 text-white transition-all duration-300 ease-in-out hover:text-blue-400" />
                    <span className="text-white text-xs">{post.comment_count}</span>
                  </button>

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
                  {/* Save Button with Lucide Bookmark Icon */}
                  <button
                    aria-label="Save button"
                    onClick={() => {
                      if (user) {
                        // Replace with actual save functionality
                        handleSave(post.id)
                      } else {
                        router.push("/login")
                      }
                    }}
                    className="flex flex-col items-center transition-transform duration-200 hover:scale-110"
                  >
                    <Bookmark
                      className={`w-7 h-7 transition-all duration-300 ease-in-out ${user?.id && post.saves.includes(user.id)
                        ? "text-yellow-500 fill-yellow-500 scale-110"
                        : "text-white"
                        }`}
                    />{" "}
                    {/* Bookmark icon */}
                  </button>

                  {/* Delete button only visible for posts made by the current user */}
                  {user?.id && (
                    <>
                      {userUUID && post.fk_author_id === userUUID && (
                        <button
                          aria-label="Delete button"
                          onClick={() => handleDelete(post.id)}
                          className="flex flex-col items-center mt-3 transition-transform duration-200 hover:scale-110"
                        >
                          <Trash2 className="w-7 h-7 text-white hover:text-red-500 transition-all duration-300 ease-in-out" />
                        </button>
                      )}
                    </>
                  )}
                  <button
                    aria-label="Show tags button"
                    onClick={() => setTagsVisible(!tagsVisible)}
                    className={`flex flex-col items-center transition-all duration-200 hover:scale-110 ${tagsVisible ? "text-red-500" : "text-white"}`}
                  >
                    <Tag
                      className={`w-7 h-7 transition-all duration-300 ease-in-out ${tagsVisible ? "scale-110" : ""}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-black text-white border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Post</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white border border-gray-700 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white border border-gray-700"
              onClick={async () => {
                if (!postToDelete) return
                try {
                  const res = await fetch("/api/posts", {
                    method: "DELETE",
                    body: JSON.stringify({ postId: postToDelete }),
                  })
                  if (res.ok) {
                    setPosts((posts) => posts.filter((post) => post.id !== postToDelete))
                  } else {
                    const data = await res.json()
                    alert(data.error || "Failed to delete post")
                  }
                } catch (_err) {
                  alert("Failed to delete post")
                } finally {
                  setDeleteDialogOpen(false)
                  setPostToDelete(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
