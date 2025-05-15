'use client'
import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs'; // Importing the useAuth hook
import Link from 'next/link';
import { Home, User, Menu, LogIn, LogOut } from 'lucide-react'; // Added LogOut icon for logout button

export default function DropDownMenu() {
  const { userId, signOut } = useAuth(); // Get signOut from useAuth
  const [isOpen, setIsOpen] = useState(false); // State to toggle the menu

  const toggleMenu = () => setIsOpen(prevState => !prevState);

  // Handle logout manually using the signOut method from Clerk
  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      {/* Gradient background behind the dropdown menu */}
      {isOpen && (
        
        <div className="absolute top-0 left-0 w-screen h-70 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none"></div>
      )}

      <div className="fixed top-1 left-1 z-50">
        
        {/* Hamburger Menu Button */}
        <button
          onClick={toggleMenu}
          aria-label="Toggle menu"
          className="text-white p-2 cursor-pointer z-10"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Revealed Menu Items (appears when isOpen is true) */}
        {isOpen && (
          <div className="flex flex-col items-center gap-2 mt-2 z-20 pointer-events-auto">
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

            {/* Login/Logout Button */}
            {!userId ? (
              <Link
                href="/login"
                aria-label="Login button"
                className="flex items-center gap-2 p-2 w-48 text-left text-white"
              >
                <LogIn className="w-6 h-6" /> Login
              </Link>
            ) : (
              <button
                onClick={handleLogout} // Logout functionality using signOut
                aria-label="Sign out button"
                className="flex items-center gap-2 p-2 w-48 text-left text-white"
              >
                <LogOut className="w-6 h-6" /> Logout {/* LogOut icon */}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
