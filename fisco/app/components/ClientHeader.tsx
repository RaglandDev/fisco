'use client';

import { useAuth, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function ClientHeader() {
  const { userId } = useAuth();

  return (
    <header className="flex justify-end p-4">
      {!userId ? (
        <Link
          href="/login"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition"
        >
          Login
        </Link>
      ) : (
        <SignOutButton>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition">
            Logout
          </button>
        </SignOutButton>
      )}
    </header>
  );
}