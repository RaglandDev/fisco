"use client"

import ImageUpload, { ImageUploadHandle } from "@/components/ImageUpload.client"
import { useState, useRef, useEffect, type TouchEvent } from "react"
import CommentDrawer from "@/components/CommentDrawer"
import Image from "next/image"
import { Heart, MessageCircle, Share2, User, Upload, ArrowLeft } from "lucide-react"
import {Post} from "@/types"

const POSTS_PER_PAGE = 5;

export default function Feed({ postData, offset }: { postData: Post[], offset: number }) {
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>(postData);
  const [showUploadPage, setShowUploadPage] = useState(false)

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const [swipeTransition, setSwipeTransition] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const [currentPostIndex, setCurrentPostIndex] = useState(0); // how deep into the feed you are


  const fetchMorePosts = async () => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/testendpoint?limit=${POSTS_PER_PAGE}&offset=${offset + posts.length}`);
    const data = await res.json();
    const newPosts: Post[] = data.posts;
    if (newPosts) {
      setPosts(prev => [...prev, ...newPosts]);
    }
  } catch (error) {
    console.error('Failed to fetch more posts', error);
  }
};

  const handleScroll = () => {
  if (containerRef.current) {
    const scrollTop = containerRef.current.scrollTop;
    const containerHeight = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / containerHeight);
    setCurrentPostIndex(newIndex);
  }
};

  useEffect(() => {
  if (currentPostIndex === posts.length - 4) { // loads posts in advance (instead of at the bottom)
    fetchMorePosts();
  }
}, [fetchMorePosts, posts.length, currentPostIndex]);




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
  const imageUploadRef = useRef<ImageUploadHandle>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Handler for upload button click
  const handleUpload = () => {
    // Call the file selection trigger in ImageUpload component
    if (imageUploadRef.current) {
      imageUploadRef.current.triggerFileSelect();
    }
  }
  
  // Handler for when upload completes successfully
  const handleUploadComplete = (_imageUrl: string) => {
    // Could add logic to add the newly uploaded image to the feed
    setUploadError(null);
    setShowUploadPage(false); // Return to feed after successful upload
    
    // Optionally refresh posts
    fetchMorePosts();
  }
  
  // Handler for upload errors
  const handleUploadError = (error: string) => {
    setUploadError(error);
  }

  const goBackToFeed = () => {
    setShowUploadPage(false)
  }

  return (
    <div
      className="w-[100dvw] h-[100dvh] md:w-[100dwh] md:h-[100dvh] md:my-4 md:rounded-xl overflow-hidden bg-black shadow-2xl relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
              <div key={post.id} className="relative h-full w-full snap-start snap-always">
                <div className="absolute inset-0">
                  <Image
                    src={`data:${post.image_data.startsWith('/9j/') ? 'image/jpeg' : 'image/png'};base64,${post.image_data}` || "/placeholder.svg"}
                    alt={'alt'}
                    fill
                    className="object-contain"
                    priority={index <= 1}
                  />
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
                      <span className="font-semibold">@Author</span>
                    </div>
                    <p className="text-sm">Caption</p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-4 items-center">
                  {/* Upload button - only visible on md and up */}
                    <button
                      onClick={() => {setShowUploadPage(true)}}
                      className="flex flex-col items-center"
                      >
                        <Upload className="w-7 h-7 text-white" />
                    </button>
                    <button onClick={() => {}} className="flex flex-col items-center">
                      <Heart
                        className={`w-7 h-7 text-white`}
                      />
                      <span className="text-white text-xs">0</span>
                    </button>

                    <button onClick={() => setIsCommentDrawerOpen(true)} className="flex flex-col items-center">
  <MessageCircle className="w-7 h-7 text-white" />
  <span className="text-white text-xs">0</span>
</button>
<CommentDrawer open={isCommentDrawerOpen} onOpenChange={setIsCommentDrawerOpen} />

                    <button onClick={() => {}} className="flex flex-col items-center">
                      <Share2 className="w-7 h-7 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upload Page */}
        <div className="w-1/2 h-full bg-black flex flex-col items-center justify-center relative">
          <button onClick={goBackToFeed} className="absolute top-4 left-4 text-white p-2">
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mx-auto">
                <Upload className="w-10 h-10 text-gray-400" />
              </div>
            </div>
            <h2 className="text-white text-xl mb-8">Share your outfit!</h2>
            <button onClick={handleUpload} className="bg-white text-black font-medium rounded-full px-8 py-3">
              Upload
            </button>
            {uploadError && <p className="text-red-500 mt-4">{uploadError}</p>}
            
            {/* Hidden ImageUpload component - only handles file selection and upload */}
            <div style={{ display: 'none' }}>
              <ImageUpload 
                ref={imageUploadRef}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
    ::-webkit-scrollbar {
      display: none;
    }
  `}</style>
    </div>
  )
}
