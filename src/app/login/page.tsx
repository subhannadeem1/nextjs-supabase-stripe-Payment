import type { Metadata } from "next";

import { LogoMark } from "@/components/logo";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[640px] -translate-x-1/2 rounded-full bg-brand opacity-[0.18] blur-3xl dark:opacity-25" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="size-12 rounded-2xl" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to your <span className="font-medium text-brand">Business OS</span>
          </p>
        </div>
        <div className="rounded-2xl border bg-card/80 p-6 shadow-xl backdrop-blur">
          <LoginForm next={typeof next === "string" ? next : "/"} />
        </div>
      </div>
    </main>
  );
}
