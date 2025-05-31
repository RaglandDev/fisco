"use client";

import { useState, useEffect } from "react";
import { useSignIn, useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const { signIn, isLoaded, setActive } = useSignIn();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      window.location.replace("/");
    }
  }, [isSignedIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    setLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        setTimeout(() => {
          window.location.replace("/");
        }, 500);
      } else {
        console.log("Additional steps required", result);
      }
    } catch (_err: unknown) {
      console.error(_err);
      if (_err && typeof _err === "object" && "errors" in _err) {
        const typed = _err as { errors?: { longMessage?: string }[] };
        setError(typed.errors?.[0]?.longMessage || "Login failed.");
      } else {
        setError("Login failed.");
      }
      setLoading(false);
    }
  }

  async function handleGoogleOAuth() {
    if (!isLoaded || !signIn) return;

    setOauthLoading("google");

    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/",
      } as Parameters<typeof signIn.authenticateWithRedirect>[0]);
    } catch (_err: unknown) {
      console.error(_err);
      setError("OAuth login failed.");
      setOauthLoading(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Google account</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">

              {/* Google OAuth Button */}
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  disabled={oauthLoading !== null || loading}
                  onClick={handleGoogleOAuth}
                >
                  {oauthLoading === "google" ? "Redirecting..." : "Login with Google"}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>

              {/* Email / Password Login */}
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="Email address input"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a href="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-label="Password input"
                  />
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}

                <Button
                  type="submit"
                  aria-label="Submit login"
                  className="w-full"
                  disabled={loading || oauthLoading !== null || !isLoaded}
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </div>

              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="/sign-up" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}