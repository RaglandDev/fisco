'use client';

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function ClientHome({ testData }: { testData: any }) {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to Fisco!</h1>

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

      <SignedIn>
        <div style={{ marginBottom: '1rem' }}>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>

      {/* home page content */}
      <pre>{JSON.stringify(testData, null, 2)}</pre>
    </div>
  );
}