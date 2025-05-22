'use client';

import React, { useEffect, useState, useRef } from 'react';
import DropDownMenu from "@/components/DropDown.client";
import { useAuth } from '@clerk/nextjs';
import { Plus } from 'lucide-react';

type SavedPost = {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
};

const Profile: React.FC = () => {
  const { userId, isLoaded } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);

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
      fetchSavedPosts(userId);
    }
  }, [userId, isLoaded]);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userendpoint?userId=${userId}`);
      const data = await response.json();
      if (data.user) {
        setUserData({
          ...data.user,
          image_data: null,
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profilephoto?user_id=${userId}`);
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

  const fetchSavedPosts = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();
      const savedIds = data.saved_galleries?.["Saved Posts"] || [];

      if (savedIds.length > 0) {
        const postRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: savedIds })
        });

        const postsData = await postRes.json();
        setSavedPosts(postsData.posts || []);
      } else {
        setSavedPosts([]);
      }
    } catch (err) {
      console.error("Failed to fetch saved posts:", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId || "");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profilephoto`, {
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
    <>
      {/* Header Section - Black */}
      <div className="w-full bg-black text-white p-8 flex flex-col items-center space-y-6">
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

      {/* Saved Posts Section - White */}
      {savedPosts.length > 0 && (
        <div className="w-full bg-white text-black py-12 px-4 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-6">Saved Posts</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl w-full">
            {savedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white text-black p-4 rounded-lg border border-black shadow-md"
              >
                <img
                  src={post.image_url}
                  alt={`Post ${post.id}`}
                  className="w-full h-64 object-contain rounded"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;