"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Loader2, Tag, Trash2, House } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tooltip } from 'react-tooltip';

// Define the pin type with a label
interface Pin {
  x: number
  y: number
  label: string
}

// Form schema for tag name
const formSchema = z.object({
  tagName: z.string().min(1, {
    message: "Tag name is required",
  }),
})

export default function PreviewPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string | null>(null)
  const [pins, setPins] = useState<Pin[]>([])
  const [isTagMode, setIsTagMode] = useState(true) // Default to tag mode
  const [editingPin, setEditingPin] = useState<{ index: number; isNew: boolean } | null>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tagName: "",
    },
  })

  useEffect(() => {
    // Only proceed if user authentication is loaded
    if (!isLoaded) return

    // If loaded but no user, redirect to login
    if (isLoaded && !user) {
      router.push("/sign-in")
      return
    }

    try {
      const dataUrl = sessionStorage.getItem("previewImageData")
      let mime = sessionStorage.getItem("previewImageType")
      if (dataUrl) {
        setImageUrl(dataUrl)
        if (!mime && dataUrl.startsWith("data:")) {
          const match = dataUrl.match(/^data:(.*?);base64,/)
          mime = match ? match[1] : null
        }
        setMimeType(mime || null)
      } else {
        setError("No image data found for preview. Please select an image again.")
      }
    } catch (_error) {
      setError("Could not retrieve image data. Please try again.")
    }
  }, [isLoaded, user, router])

  // Set form values when editing starts
  useEffect(() => {
    if (editingPin !== null) {
      form.reset({ tagName: pins[editingPin.index]?.label || "" })
      // Focus the input after a short delay to ensure the form is rendered
      setTimeout(() => {
        const input = document.querySelector('input[name="tagName"]') as HTMLInputElement
        if (input) input.focus()
      }, 10)
    }
  }, [editingPin, form, pins])

  // Helper to convert data URL to File
  async function dataURLtoFile(dataurl: string, filename: string, mimeType: string): Promise<File> {
    const res = await fetch(dataurl)
    const blob = await res.blob()
    return new File([blob], filename, { type: mimeType })
  }

  async function uploadToS3(file: File) {
    const fileType = encodeURIComponent(file.type)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/media?fileType=${fileType}`)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const { uploadUrl, key, url } = data // grab public URL

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    })

    if (!uploadResponse.ok) {
      throw new Error(`S3 upload failed! status: ${uploadResponse.status}`)
    }

    return { key, url } // return both
  }

  const handleSubmit = async () => {
    if (!user) {
      setError("User not authenticated. Please sign in.")
      return
    }

    if (!imageUrl || !mimeType) {
      setError("Image data missing. Cannot submit.")
      return
    }

    // Don't allow submission while editing a pin
    if (editingPin !== null) {
      setError("Please finish naming your pin before submitting.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      // 1. Convert Data URL to File
      const imageFile = await dataURLtoFile(imageUrl, "upload.png", mimeType)
      // 2. Upload Image to /api/images
      const formData = new FormData()
      formData.append("file", imageFile)

      // Upload to S3 and get key
      const file = formData.get("file")
      if (!file) {
        return null
      }
      const s3data = await uploadToS3(file as File)
      //

      // store key and url in db
      const storeS3DataResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/images`, {
        method: "POST",
        body: JSON.stringify(s3data),
      })
      if (!storeS3DataResponse.ok) {
        const errorText = await storeS3DataResponse.text()
        throw new Error(`Storing s3 image data failed: ${errorText || storeS3DataResponse.statusText}`)
      }
      const storeS3DataResult = await storeS3DataResponse.json()
      const imageId = storeS3DataResult.id
      if (!imageId) throw new Error("S3 data ID not received after upload.")
      // 3. Create Post with imageId
      const tagData = JSON.stringify(pins)
      const postResponse = await fetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          fk_image_id: imageId,
          clerk_user_id: user.id,
          tags: tagData,
        }),
      })
      if (!postResponse.ok) {
        const errorText = await postResponse.text()
        throw new Error(`Failed to create post: ${errorText || postResponse.statusText}`)
      }
      router.push("/")
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle click on the image to place a pin when in tag mode
  const handleImageClick = (e: React.MouseEvent) => {
    if (!isTagMode || !imageContainerRef.current || editingPin !== null) return

    // Get click position relative to the image container
    const imageRect = imageContainerRef.current.getBoundingClientRect()
    const relativeX = (e.clientX - imageRect.left) / imageRect.width
    const relativeY = (e.clientY - imageRect.top) / imageRect.height

    // Add new pin with empty label
    const newPin: Pin = { x: relativeX, y: relativeY, label: "" }
    const newPins = [...pins, newPin]
    setPins(newPins)

    // Start editing the newly added pin
    setEditingPin({
      index: newPins.length - 1,
      isNew: true, // Mark this as a new pin
    })
  }

  const removePin = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setPins(pins.filter((_, i) => i !== index))
    if (editingPin?.index === index) {
      setEditingPin(null)
    }
  }

  const handlePinClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering image click

    // If in delete mode, delete the pin
    if (!isTagMode) {
      removePin(index, e)
      return
    }

    // Otherwise, if in tag mode and not currently editing, edit the pin
    if (editingPin === null) {
      setEditingPin({
        index,
        isNew: false, // This is an existing pin
      })
    }
  }

  const savePinLabel = useCallback(
    (values: z.infer<typeof formSchema>) => {
      if (editingPin !== null) {
        const updatedPins = [...pins]
        updatedPins[editingPin.index] = {
          ...updatedPins[editingPin.index],
          label: values.tagName.trim(),
        }
        setPins(updatedPins)
        setEditingPin(null)
        form.reset({ tagName: "" })
      }
    },
    [editingPin, pins, form],
  )

  const cancelEditing = useCallback(() => {
    if (editingPin !== null) {
      // If this is a new pin, remove it
      if (editingPin.isNew) {
        setPins(pins.filter((_, i) => i !== editingPin.index))
      }
      // Close the overlay
      setEditingPin(null)
      form.reset({ tagName: "" })
    }
  }, [editingPin, pins, form])

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingPin !== null) {
        if (e.key === "Escape") {
          e.preventDefault()
          cancelEditing()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [editingPin, cancelEditing])

  // Helper function to determine label position based on pin position
  const getLabelPosition = (x: number, y: number) => {
    // Threshold values for edges (as percentage)
    const topThreshold = 0.15 // 15% from top
    const leftThreshold = 0.15 // 15% from left
    const rightThreshold = 0.85 // 15% from right

    // Default position (above the pin)
    const position = {
      top: "-top-8",
      left: "left-1/2",
      transform: "-translate-x-1/2",
      origin: "",
    }

    // If pin is near the top, place label below
    if (y < topThreshold) {
      position.top = "top-8"
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

  // Show loading state while user authentication is loading
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <Loader2 className="h-8 w-8 animate-spin mb-2" />
        <p>Loading user data...</p>
      </div>
    )
  }

  // Redirect if no user (this is a fallback, the useEffect should handle this)
  if (isLoaded && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 p-4">
        <p>You must be signed in to view this page.</p>
      </div>
    )
  }

  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 p-4">
        <p>No image data found for preview. Please go back and select an image.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      {imageUrl ? (
        <div
          ref={imageContainerRef}
          className={`relative w-full max-w-lg aspect-[4/3] mb-6 rounded-lg overflow-hidden border border-gray-700 ${
            isTagMode ? "cursor-crosshair" : "cursor-pointer"
          }`}
          onClick={handleImageClick}
        >
          <Image src={imageUrl || "/placeholder.svg"} alt="Preview" layout="fill" objectFit="contain" unoptimized />

          {/* Render existing pins */}
          {pins.map((pin, index) => {
            // Get dynamic position for label based on pin position
            const labelPosition = getLabelPosition(pin.x, pin.y)

            return (
              <div
                key={index}
                className={`absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group ${
                  !isTagMode ? "animate-pulse" : ""
                }`}
                style={{
                  left: `${pin.x * 100}%`,
                  top: `${pin.y * 100}%`,
                }}
                onClick={(e) => handlePinClick(index, e)}
              >
                {/* Add some margin so tag icon looks like the right position*/}
                <Tag
                  className={`h-6 w-6 ${
                    !isTagMode
                      ? "text-red-500 fill-red-500/80"
                      : "text-red-500 fill-red-500/50 group-hover:fill-red-500/80"
                  } transition-all`}
                />

                {/* Dynamically positioned pin label */}
                {pin.label && editingPin?.index !== index && (
                  <div
                    className={`absolute ${labelPosition.top} ${labelPosition.left} ${labelPosition.origin} transform ${labelPosition.transform} bg-black text-white text-xs px-2 py-1 rounded-md whitespace-nowrap`}
                  >
                    {pin.label}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : !error ? (
        <div className="flex flex-col items-center justify-center h-64 w-full">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Loading image...</p>
        </div>
      ) : null}

      {/* Mode toggle and buttons */}
      <div className="flex flex-col items-center gap-5">
        {/* Mode toggle buttons */}
        <div className="flex items-center gap-4">
          {/* Delete mode button */}
          <button
            type="button"
            onClick={() => !editingPin && setIsTagMode(false)}
            disabled={editingPin !== null}
            className={`flex items-center justify-center p-3 rounded-lg transition-colors bg-white ${
              !isTagMode ? "text-red-500" : "text-gray-400"
            } ${editingPin !== null ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            data-tooltip-id="trash-button-tooltip"
            data-tooltip-content="Remove A Tag"
          >
            <Trash2 className="h-5 w-5" />
            <Tooltip id="trash-button-tooltip" />
          </button>

          {/* Add tag mode button */}
          <button
            type="button"
            onClick={() => !editingPin && setIsTagMode(true)}
            disabled={editingPin !== null}
            className={`flex items-center justify-center p-3 rounded-lg transition-colors bg-white ${
              isTagMode ? "text-black" : "text-gray-400 hover:text-gray-600"
            } ${editingPin !== null ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            data-tooltip-id="tag-button-tooltip"
            data-tooltip-content="Add a Tag to the Image!"
          >
            <Tag className="h-5 w-5" />
            <Tooltip id="tag-button-tooltip" />
          </button>
            {/* Exit Button */}
          <button
            type="button"
            onClick={() => router.push("/")}
            data-tooltip-id="exit-button-tooltip"
            data-tooltip-content="Exit to Home"
            className="flex items-center justify-center p-3 rounded-lg transition-colors text-black bg-white"
            >
            <House>
            </House>
            </button>
            <Tooltip id="exit-button-tooltip" />
        </div>

        {/* Share Button */}
        <Button
          onClick={handleSubmit}
          aria-label="Upload submit button"
          data-testid="Upload submit button"
          disabled={isSubmitting || !imageUrl || !!error || editingPin !== null}
          className="px-8 py-3 text-lg bg-white text-black hover:bg-gray-100 disabled:bg-gray-300 disabled:text-gray-500"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-black" />
              Submitting...
            </>
          ) : (
            "Share"
          )}
        </Button>
        
      </div>

      {/* Mobile-friendly tag naming overlay */}
      {editingPin !== null && (
        <div className="fixed inset-0 bg-black/90 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-black w-full sm:w-auto sm:max-w-md sm:rounded-lg overflow-hidden shadow-2xl border-t border-gray-800 sm:border"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            <Form {...form}>
              <form ref={formRef} onSubmit={form.handleSubmit(savePinLabel)} className="flex flex-col">
                <div className="p-4 sm:p-6">
                  <FormField
                    control={form.control}
                    name="tagName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Enter item name..."
                            className="w-full bg-black border-gray-800 text-white text-base h-12 rounded-md"
                            autoFocus
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex border-t border-gray-800">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={cancelEditing}
                    className="flex-1 rounded-none h-14 text-gray-300 hover:bg-gray-900 hover:text-white text-base font-normal"
                  >
                    Cancel
                  </Button>
                  <div className="w-px bg-gray-800" />
                  <Button
                    type="submit"
                    disabled={!form.formState.isValid}
                    className="flex-1 rounded-none h-14 bg-white text-black hover:bg-gray-200 text-base font-medium"
                  >
                    Save
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </div>
  )
}
