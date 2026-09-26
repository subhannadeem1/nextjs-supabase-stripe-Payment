"use client";

import { useActionState, useState } from "react";
import { Loader2, LogIn } from "lucide-react";

import { login, type LoginState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  // Controlled so a wrong password doesn't wipe the email (React resets forms after actions).
  const [email, setEmail] = useState("");
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state?.error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="mt-1">
        {pending ? <Loader2 className="animate-spin" /> : <LogIn />}
        Sign in
      </Button>
    </form>
  );
}
