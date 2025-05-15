'use client';

import React, { useEffect, useState, useRef } from 'react';
import DropDownMenu from "@/components/DropDown.client";
import { useAuth } from '@clerk/nextjs';
import { Plus } from 'lucide-react';

const Profile: React.FC = () => {
  const { userId, isLoaded } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    fk_image_id: string | null;
    image_data: string | null;
  } | null>(null);

  useEffect(() => {
    if (userId && isLoaded) {
      fetchUserData(userId);
      fetchProfileImage(userId);
    }
  }, [userId, isLoaded]);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`/api/userendpoint?userId=${userId}`);
      const data = await response.json();

      if (data.user) {
        setUserData({
          ...data.user,
          image_data: null, // we'll fetch it separately
        });
        setError(null);
      } else {
        setError('User not found');
      }
    } catch (error) {
      setError('Error fetching user data');
      console.error('Error fetching user data:', error);
    }
  };

  const fetchProfileImage = async (userId: string) => {
    try {
      const res = await fetch(`/api/profilephoto?user_id=${userId}`);
      const data = await res.json();

      if (data.image_data) {
        setUserData(prev =>
          prev ? { ...prev, image_data: data.image_data } : prev
        );
      }
    } catch (err) {
      console.error("Failed to fetch profile image:", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId || "");

    try {
      const response = await fetch("/api/profilephoto", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upload failed");

      setUserData(prev =>
        prev ? { ...prev, fk_image_id: data.id, image_data: data.image_data } : prev
      );
    } catch (err) {
      console.error("Failed to upload profile photo:", err);
      alert("Failed to update profile photo.");
    }
  };

  if (error) return <div>{error}</div>;
  if (!userData && isLoaded) return <div>Loading...</div>;

  const imageSrc = userData?.image_data
    ? `data:image/jpeg;base64,${userData.image_data}`
    : null;

  return (
    <div className="w-full h-full bg-black text-white p-8 flex flex-col items-center justify-center space-y-6">
      <div className="flex items-center justify-center gap-6">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white relative">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-full flex items-center justify-center bg-gray-800 hover:bg-gray-700"
          >
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <Plus className="w-10 h-10 text-white opacity-70" />
            )}
          </button>

          <input
            id="profile-file-input"
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-semibold">
            {userData?.first_name} {userData?.last_name}
          </h1>
          <p className="text-sm">{userData?.email}</p>
        </div>
      </div>

      <DropDownMenu />
    </div>
  );
};

export default Profile;
