'use client'
import React from 'react';
import Link from "next/link";
import { useAuth } from '@clerk/nextjs';
import { Home, User } from 'lucide-react'; // Importing the icons

export default function BottomNavBar() {
  const { userId } = useAuth();
  
  return (
    <div className="fixed bottom-0 left-0 w-full flex justify-center gap-8 p-4 z-50">
      {/* Home Button with Icon */}
      <Link href="/">
        <button className="bg-black text-white p-4 rounded-full hover:bg-gray-700">
          <Home className="w-6 h-6" /> {/* Home Icon */}
        </button>
      </Link>

      {/* Profile Button with Icon - Conditional redirect */}
      <Link href={userId ? "/profile" : "/login"}>
        <button className="bg-black text-white p-4 rounded-full hover:bg-gray-700">
          <User className="w-6 h-6" /> {/* User Icon */}
        </button>
      </Link>
    </div>
  );
}
