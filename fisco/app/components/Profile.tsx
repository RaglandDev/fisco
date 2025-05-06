// components/Profile.tsx
'use client';

import React, { useEffect, useState } from 'react';
import BottomNavBar from "@/components/BottomBar";
import { useAuth } from '@clerk/nextjs';

const Profile: React.FC = () => {
  const { userId, isLoaded } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const [userData, setUserData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    image_url: string;
  } | null>(null);

  useEffect(() => {
    if (userId && isLoaded) {
      fetchUserData(userId);
    }
  }, [userId, isLoaded]);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/userendpoint?userId=${userId}`); // Call your new API endpoint
      const data = await response.json();
    
      if (data.user) {
        setUserData(data.user); // Store the user data in state
        setError(null);
      } else {
        setError('User not found');
      }
    } catch (error) {
      setError('Error fetching user data');
      console.error('Error fetching user data:', error);
    }
  };

  if (error) {
      return <div>{error}</div>; 
  } 

  if (!userData && isLoaded) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="w-full h-full bg-black text-white p-8 flex flex-col items-center justify-center space-y-6">
      <div className="flex items-center justify-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden">
          <img
            src={userData?.image_url}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-semibold">
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