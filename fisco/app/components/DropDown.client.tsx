"use client"
import { useState, useRef } from "react"
import { useAuth } from "@clerk/nextjs" // Importing the useAuth hook
import Link from "next/link"
import { Home, User, Menu, LogIn, LogOut, Upload } from "lucide-react" // Added Upload icon
import ImageUpload, { type ImageUploadHandle } from "@/components/ImageUpload.client"

export default function DropDownMenu() {
  const { userId, signOut } = useAuth() // Get signOut from useAuth
  const [isOpen, setIsOpen] = useState(false) // State to toggle the menu
  const imageUploadRef = useRef<ImageUploadHandle>(null)
  const [_uploadError, setUploadError] = useState<string | null>(null)

  const toggleMenu = () => setIsOpen((prevState) => !prevState)

  // Handle logout manually using the signOut method from Clerk
  const handleLogout = async () => {
    await signOut()
  }

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
    window.location.href = "/preview"
  }

  // Handler for upload errors
  const handleUploadError = (error: string) => {
    setUploadError(error)
  }

  return (
    <>
      {/* Gradient background behind the dropdown menu */}
      {isOpen && (
        <div className="absolute top-0 left-0 w-screen h-70 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none transition-opacity duration-300 ease-in-out"></div>
      )}

      <div className="fixed top-1 left-1 z-50">
        {/* Hamburger Menu Button */}
        <button onClick={toggleMenu} aria-label="Toggle menu" className="text-white p-2 cursor-pointer">
          <Menu className="w-6 h-6" />
        </button>

        {/* Revealed Menu Items (appears when isOpen is true) */}
        {isOpen && (
          <div className="flex flex-col items-center gap-2 mt-2 z-50 pointer-events-auto opacity-0 animate-fadeIn">
            {/* Home Button */}
            <Link href="/">
              <button className="flex items-center gap-2 p-2 w-48 text-left text-white">
                <Home className="w-6 h-6" /> Home
              </button>
            </Link>

            {/* Profile Button - Conditional redirect */}
            <Link href={userId ? "/profile" : "/login"}>
              <button className="flex items-center gap-2 p-2 w-48 text-left text-white">
                <User className="w-6 h-6" /> Profile
              </button>
            </Link>

            {/* Upload Button */}
            <button
              onClick={userId ? handleUpload : () => (window.location.href = "/login")}
              className="flex items-center gap-2 p-2 w-48 text-left text-white"
            >
              <Upload className="w-6 h-6" /> Upload
            </button>

            {/* Login/Logout Button */}
            <div className="relative w-48 h-10">
                <div 
                    key={userId ? "logout" : "login"}
                    className="absolute inset-0 flex items-center gap-2 p-2 text-left text-white transition-all duration-300 ease-in-out opacity-0 animate-fadeIn"
                >
                {!userId ? (
                    <Link
                        href="/login"
                        aria-label="Login button"
                        className="flex items-center gap-2 w-48 text-left text-white"
                    >
                        <LogIn className="w-6 h-6" /> Login
                    </Link>
                ) : (
                <button
                    onClick={handleLogout} // Logout functionality using signOut
                    aria-label="Sign out button"
                    className="flex items-center gap-2 w-48 text-left text-white"
                >
                    <LogOut className="w-6 h-6" /> Logout {/* LogOut icon */}
                </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden ImageUpload component - only handles file selection and upload */}
      <div style={{ display: "none" }}>
        <ImageUpload ref={imageUploadRef} onUploadComplete={handleUploadComplete} onUploadError={handleUploadError} />
      </div>
      <style jsx global>{`
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in-out forwards;
  }
`}</style>
    </>
  )
}
