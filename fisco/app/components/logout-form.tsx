"use client";

import { SignInButton, SignOutButton, useAuth } from "@clerk/nextjs";

export default function Home() {
  const { sessionId } = useAuth();

  return (
    <header className="flex justify-end p-4">
      {!sessionId ? (
        <SignInButton mode="modal">
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition">
            Login
          </button>
        </SignInButton>
      ) : (
        <SignOutButton redirectUrl="/">
          <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md hover:opacity-90 transition">
            Logout
          </button>
        </SignOutButton>
      )}
    </header>
  );
}