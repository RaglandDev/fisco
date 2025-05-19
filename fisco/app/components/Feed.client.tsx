"use client"

import ImageUpload, { type ImageUploadHandle } from "@/components/ImageUpload.client"
import { useState, useRef, useEffect, type TouchEvent } from "react"
import CommentDrawer from "@/components/CommentDrawer.client"
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
import { Heart, MessageCircle, Share2, User, Upload, ArrowLeft, Bookmark, Trash2, Tag } from "lucide-react"
import type { Post } from "@/types"


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

const POSTS_PER_PAGE = 5

export default function Feed({ postData, offset }: { postData: Post[]; offset: number }) {
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null)
  const [posts, setPosts] = useState<Post[]>(postData)
  const [showUploadPage, setShowUploadPage] = useState(false)
  // Lock for liking posts
  const [likeInProgress, setLikeInProgress] = useState<string | null>(null)

  // Lock for saving posts
  const [saveInProgress, setSaveInProgress] = useState<string | null>(null)

  // Store the database UUID for the current user
  const [userDbId, setUserDbId] = useState<string | null>(null)

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const [swipeTransition, setSwipeTransition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const [currentPostIndex, setCurrentPostIndex] = useState(0) // how deep into the feed you are

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)

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
  }, [posts.length, currentPostIndex])

  // Minimum swipe distance required (in px)
  const minSwipeDistance = 30

  // Touch event handlers for swipe detection
  const onTouchStart = (e: TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)

    if (touchStart && touchEnd) {
      const distance = touchEnd - touchStart
      const isLeftSwipe = distance < 0
      const isRightSwipe = distance > 0

      // Only allow left swipe on feed page and right swipe on upload page
      if ((isLeftSwipe && !showUploadPage) || (isRightSwipe && showUploadPage)) {
        // Calculate transition percentage based on swipe distance (max 100%)
        const transitionPercentage = Math.min(Math.abs(distance) / 200, 1) * (isLeftSwipe ? 1 : -1)
        setSwipeTransition(transitionPercentage)
      }
    }
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance < 0
    const isRightSwipe = distance > 0

    // Detect right swipe on feed page
    if (isRightSwipe && !showUploadPage && Math.abs(distance) > minSwipeDistance) {
      setShowUploadPage(true)
    }

    // Detect left swipe on upload page
    if (isLeftSwipe && showUploadPage && Math.abs(distance) > minSwipeDistance) {
      setShowUploadPage(false)
    }

    // Reset transition
    setSwipeTransition(0)
    setTouchStart(null)
    setTouchEnd(null)
  }

  // Reference to the ImageUpload component
  const imageUploadRef = useRef<ImageUploadHandle>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [tagsVisible, setTagsVisible] = useState(false)

  // Handler for upload button click
  const handleUpload = () => {
    // Call the file selection trigger in ImageUpload component
    if (imageUploadRef.current) {
      imageUploadRef.current.triggerFileSelect()
    }
  }

  // Handler for when upload completes successfully
  const handleUploadComplete = (imageUrl: string) => {
    setUploadError(null)
    setShowUploadPage(false) // Hide upload page

    // Save image data to sessionStorage for preview page
    sessionStorage.setItem("previewImageData", imageUrl)

    // Extract mime type from data URL if possible
    let mime = null
    if (imageUrl.startsWith("data:")) {
      const match = imageUrl.match(/^data:(.*?);base64,/)
      mime = match ? match[1] : null
    }
    if (mime) sessionStorage.setItem("previewImageType", mime)

    // Navigate to preview page
    router.push("/preview")
  }

  // Handler for upload errors
  const handleUploadError = (error: string) => {
    setUploadError(error)
  }

  const goBackToFeed = () => {
    setShowUploadPage(false)
  }

  const { user } = useUser()

  // Fetch the user's database UUID when logged in
  useEffect(() => {
    const fetchUserDbId = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/users/me?clerkUserId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.internalUserId) {
              setUserDbId(data.internalUserId)
            }
          }
        } catch (error) {
          console.error("Error fetching user DB ID:", error)
        }
      }
    }

    fetchUserDbId()
  }, [user?.id])

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

    // Make an API call to update the likes array for the post
    try {
      // Determines whether to like/remove like from the post
      await fetch(`/api/testendpoint`, {
        method: hasLiked ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id, userId }), // send ID in body, not path
      })

      // Update the likes array for the specific post in the client-side state
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
    } catch (error) {
      console.error("Error liking post:", error)
    } finally {
      // Unlock
      setLikeInProgress(null)
    }
  }
  const handleSave = async (post_id: string) => {
    // If user is not signed in
    if (!user) {
      alert("Please sign in to like posts!")
      return
    }
    // Prohibits the user from liking the same post multiple times
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

    // Make an API call to update the likes array for the post
    try {
      // Determines whether to like/remove like from the post
      await fetch(`/api/profile`, {
        method: hasSaved ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ post_id, userId }), // send ID in body, not path
      })

      // Update the likes array for the specific post in the client-side state
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === post_id) {
            if (hasSaved) {
              // Remove the user ID from the likes array
              return {
                ...post,
                saves: post.saves.filter((id) => id !== userId),
              }
            } else {
              // Add the user ID to the likes array
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
    } catch (error) {
      console.error("Error saving post:", error)
    } finally {
      // Unlock
      setSaveInProgress(null)
    }
  }

  return (
    <div
      className="w-[100dvw] h-[100dvh] md:w-[100dwh] md:h-[100dvh] md:my-4 md:rounded-xl overflow-hidden bg-black shadow-2xl relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      aria-label="Feed window"
    >
      <div
        className="flex w-[200%] h-[100dvh] transition-transform duration-300"
        style={{ transform: showUploadPage ? "translateX(-50%)" : `translateX(${swipeTransition * 50}%)` }}
      >
        {/* Feed Page */}
        <div className="w-1/2 h-full relative">
          <div
            ref={containerRef}
            className="h-full w-full overflow-y-auto snap-y snap-mandatory"
            style={{ scrollbarWidth: "none" }}
            onScroll={handleScroll}
          >
            {posts.map((post, index) => (
              <div key={post.id} className="relative h-full w-full snap-start snap-alway">
                <div className="absolute inset-0">
                  <Image
                    data-testid="Post image"
                    src={
                      `data:${post.image_data.startsWith("/9j/") ? "image/jpeg" : "image/png"};base64,${post.image_data}` ||
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
                      <span className="font-semibold">
                        @{post.first_name} {post.last_name}
                      </span>
                    </div>
                    <p className="text-sm">I created this post at {post.created_at.toLocaleString()}!</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-3 items-center">
                    {/* Upload button - only visible on md and up */}
                    <button aria-label="Upload button" 
                        onClick={() => {
                            if (user) {
                                handleUpload()
                            } else {
                              router.push("/login")
                            }
                          }}
                        className="flex flex-col items-center">
                      <Upload className="w-7 h-7 text-white" />
                    </button>
                    <button
                      aria-label="Like button"
                      onClick={() => {
                        if (user) {
                          handleLike(post.id)
                        } else {
                          router.push("/login")
                        }
                      }}
                      className="flex flex-col items-center"
                    >
                      <Heart
                        className={`w-7 h-7 transition-colors duration-200 ease-in-out  ${
                          user?.id && post.likes.includes(user.id) ? "text-red-500 fill-red-500" : "text-white"
                        }`}
                      />
                      <span className="text-white text-xs">{post.likes.length}</span>
                    </button>
                    <button
                      aria-label="Comment button"
                      onClick={() => setActiveCommentPostId(post.id)}
                      className="flex flex-col items-center"
                    >
                      <MessageCircle className="w-7 h-7 text-white" />
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
                      className="flex flex-col items-center"
                    >
                      <Bookmark
                        className={`w-7 h-7 transition-colors duration-200 ease-in-out  ${
                          user?.id && post.saves.includes(user.id) ? "text-yellow-500 fill-yellow-500" : "text-white"
                        }`}
                      />{" "}
                      {/* Bookmark icon */}
                    </button>

                    <button onClick={() => {}} className="flex flex-col items-center">
                      <Share2 className="w-7 h-7 text-white" />
                    </button>

                    {/* Delete button only visible for posts made by the current user */}
                    {user?.id && (
                      <>
                        {userDbId && post.fk_author_id === userDbId && (
                          <button
                            aria-label="Delete button"
                            onClick={() => handleDelete(post.id)}
                            className="flex flex-col items-center mt-3"
                          >
                            <Trash2 className="w-7 h-7 text-white hover:text-red-500 transition-colors duration-200 ease-in-out" />
                          </button>
                        )}
                      </>
                    )}
                    <button
                      aria-label="Show tags button"
                      onClick={() => setTagsVisible(!tagsVisible)}
                      className={`flex flex-col items-center transition-colors duration-200 ${tagsVisible ? "text-red-500" : "text-white"}`}
                    >
                      <Tag className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Page */}
        <div className="w-1/2 h-full bg-black flex flex-col items-center justify-center relative">
          <button aria-label="Return button" onClick={goBackToFeed} className="absolute top-4 left-4 text-white p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                <Upload className="w-10 h-10 text-gray-400" />
              </div>
            </div>
            <h2 className="text-white text-xl mb-8">Share your outfit!</h2>
            <button
              aria-label="Feed upload button"
              onClick={handleUpload}
              className="bg-white text-black font-medium rounded-full px-8 py-3"
            >
              Upload
            </button>
            {uploadError && <p className="text-red-500 mt-4">{uploadError}</p>}

            {/* Hidden ImageUpload component - only handles file selection and upload */}
            <div style={{ display: "none" }}>
              <ImageUpload
                ref={imageUploadRef}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </div>
          </div>
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
                    headers: { "Content-Type": "application/json" },
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
  `}</style>
    </div>
  )
}
