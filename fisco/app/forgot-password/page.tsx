'use client';

import { useSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const { signIn, isLoaded, setActive: setClientActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || signIn === null) return;

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setSent(true);
    } catch (err: any) {
      setError("Failed to send reset email.");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!signIn) return;

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        await setClientActive({ session: result.createdSessionId });
        window.location.replace("/");
      }
    } catch (err: any) {
      setError("Password reset failed.");
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      {!sent ? (
        <form onSubmit={handleRequestReset} className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit">Send Reset Code</Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Enter Code & New Password</h1>
          <Input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Reset Code" required />
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" required />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit">Reset Password</Button>
        </form>
      )}
    </div>
  );
}
