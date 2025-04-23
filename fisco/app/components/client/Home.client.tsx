'use client';

import { Post } from "@/types/index";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function ClientHome({ postData }: { postData: Post }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to Fisco!</h1>
        <ClerkProvider>
            <SignedOut>
                <div style={{ marginBottom: '1rem' }}>
                <SignInButton mode="modal">
                    <button style={{ marginRight: '1rem' }}>Sign In</button>
                </SignInButton>

                <SignUpButton mode="modal">
                    <button>Sign Up</button>
                </SignUpButton>
                </div>
            </SignedOut>
        </ClerkProvider>

      <SignedIn>
        <div style={{ marginBottom: '1rem' }}>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>

      {/* home page content */}
      <pre>{JSON.stringify(postData, null, 2)}</pre>
    </div>
  );
}