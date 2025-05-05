'use client';

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function CustomSignUpPage() {
  const { signUp, isLoaded, setActive: setClientActive } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;

    try {
      await signUp.create({ email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      console.log(email, password)
      setPendingVerification(true);
    } catch (_err: unknown) {
      if (typeof _err === "object" && _err && "errors" in _err) {
        const typed = _err as { errors?: { longMessage?: string }[] };
        setError(typed.errors?.[0]?.longMessage || "Sign up failed.");
      } else {
        setError("Sign up failed.");
      }
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!signUp) return;

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setClientActive({ session: result.createdSessionId });
        window.location.replace("/");
      }
    } catch (err: unknown) {
      console.log(err)
      setError("Verification failed.");
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      {!pendingVerification ? (
        <form onSubmit={handleSignUp} className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Sign Up</h1>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit">Create Account</Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold">Verify Your Email</h1>
          <Input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Verification code"
            required
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button type="submit">Verify</Button>
        </form>
      )}
    </div>
  );
}
