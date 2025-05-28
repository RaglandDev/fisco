'use client';

import React, { useEffect, useState, useRef } from 'react';
import DropDownMenu from "@/components/DropDown.client";
import { Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type Post = {
  id: string;
  image_url: string;
  title?: string;
  description?: string;
};

type ProfileProps = {
  userId: string;
  isOwner: boolean;
};

const Profile: React.FC<ProfileProps> = ({ userId, isOwner }) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [yourPosts, setYourPosts] = useState<Post[]>([]);
  const [showSaved, setShowSaved] = useState(true);

  const [userData, setUserData] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    fk_image_id: string | null;
    image_data: string | null;
  } | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserData(userId);
      fetchProfileImage(userId);
      fetchSavedPosts(userId);
      fetchYourPosts(userId);
    }
  }, [userId]);

  const fetchUserData = async (userId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/userendpoint?userId=${userId}`);
      const data = await response.json();
      if (data.user) {
        setUserData({ ...data.user, image_data: null });
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
      if (data.image_url) {
        setUserData(prev => prev ? { ...prev, image_data: data.image_url } : prev);
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

  const fetchYourPosts = async (userId: string) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/posts/by-author`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ authorId: userId }),
    });

    if (!res.ok) {
      const errorText = await res.text(); // probably HTML
      throw new Error(`API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    setYourPosts(data.posts || []);
  } catch (err) {
    console.error("Failed to fetch your posts:", err);
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
        prev ? { ...prev, fk_image_id: data.id, image_data: data.image_url } : prev
      );
    } catch (err) {
      console.error("Failed to upload profile photo:", err);
      alert("Failed to update profile photo.");
    }
  };

  if (error) return <div>{error}</div>;
  if (!userData) return <div>Loading...</div>;

  const imageSrc = userData.image_data || '';

  const displayedPosts = showSaved ? savedPosts : yourPosts;

  return (
    <>
      <div className="w-full bg-black text-white p-8 flex flex-col items-center space-y-6">
        <div className="flex items-center justify-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white relative">
            {isOwner ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full flex items-center justify-center bg-gray-800 hover:bg-gray-700"
              >
                {imageSrc ? (
                  <Image
                    src={imageSrc}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Plus className="w-10 h-10 text-white opacity-70" />
                )}
              </button>
            ) : (
              imageSrc && (
                <Image
                  src={imageSrc}
                  alt="Profile"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              )
            )}
            {isOwner && (
              <input
                id="profile-file-input"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            )}
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-semibold">
              {userData.first_name} {userData.last_name}
            </h1>
            <p className="text-sm">{userData.email}</p>
          </div>
        </div>
        <DropDownMenu />
      </div>

      <div className="w-full bg-gray-100 py-4 flex justify-center gap-6">
        <button
          className={`px-4 py-2 rounded-md ${showSaved ? "bg-black text-white" : "bg-white text-black border"}`}
          onClick={() => setShowSaved(true)}
        >
          Saved Posts
        </button>
        <button
          className={`px-4 py-2 rounded-md ${!showSaved ? "bg-black text-white" : "bg-white text-black border"}`}
          onClick={() => setShowSaved(false)}
        >
          Your Posts
        </button>
      </div>

      <div className="w-full bg-white text-black py-12 px-4 flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-6">{showSaved ? "Saved Posts" : "Your Posts"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {displayedPosts.map((post) => (
            <Link href={`/?postId=${post.id}`} key={post.id}>
              <div className="cursor-pointer rounded group">
                <div className="aspect-[4/5] overflow-hidden rounded">
                  <Image
                    src={post.image_url}
                    alt={`Post ${post.id}`}
                    width={400}
                    height={500}
                    className="w-full h-full object-cover transform transition-transform duration-300 ease-in-out group-hover:scale-105"
                  />
                </div>
                {post.title && (
                  <p className="mt-2 text-center text-sm font-medium text-black">{post.title}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Profile;