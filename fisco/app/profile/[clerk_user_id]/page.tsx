'use client';

import { useAuth } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import Profile from '@/components/Profile.client';

export default function ProfilePage() {
  const { userId: authUserId, isLoaded } = useAuth();
  const params = useParams();
  const clerk_user_id = params.clerk_user_id as string;

  if (!isLoaded || !clerk_user_id) return <div>Loading...</div>;

  return (
    <Profile
      userId={clerk_user_id}
      isOwner={clerk_user_id === authUserId}
    />
  );
}
