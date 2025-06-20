'use client'
import { useAuth, SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function ClientHeader() {
  const { userId } = useAuth();

  return (
    <header className="absolute top-4 right-4 z-50">
      {!userId ? (
        <Link
          aria-label="Login button"
          href="/login"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition"
        >
          Login
        </Link>
      ) : (
        <SignOutButton>
          <button aria-label="Sign out button" className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition">
            Logout
          </button>
        </SignOutButton>
      )}
    </header>
  );
}