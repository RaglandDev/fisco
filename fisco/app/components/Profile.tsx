// components/Profile.tsx
'use client';

import React, { useEffect, useState } from 'react';
import BottomNavBar from "@/components/BottomBar";
import { Post } from "@/types/index";
import { useAuth } from '@clerk/nextjs';



const Profile: React.FC = () => {
  // Assuming you fetch the user data via API or context
  const { userId, isLoaded } = useAuth();

  const [userData, setUserData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    image_url: string;
  } | null>(null);

  useEffect(() => {
    if (userId && isLoaded) {
      // Fetch user data from Clerk API using userId
      console.log("User ID:", userId);
      fetchUserData(userId);
    }
  }, [userId, isLoaded]);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/userendpoint?userId=${userId}`); // Call your new API endpoint
      const data = await response.json();
      console.log("User Data:", data);
      if (data.user) {
        setUserData(data.user); // Store the user data in state
      } else {
        console.error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Wait for the user data to load, or show loading if not available
  if (!userData && isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full h-full bg-black text-white p-8">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden">
          {/* Display the actual user profile image */}
          <img
            src={userData?.image_url }
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          {/* Display first name, last name, and email from loaded user data */}
          <h1 className="text-3xl font-semibold">
            {userData?.first_name} {userData?.last_name}
          </h1>
          <p className="text-sm">{userData?.email}</p>
        </div>
      </div>


      <BottomNavBar />
    </div>
  );
};

export default Profile;