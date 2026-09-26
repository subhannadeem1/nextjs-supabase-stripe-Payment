import "server-only";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { requireAuth } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import type { ActionResult } from "@/lib/types";

/** Friendly message from anything thrown inside an action. */
export function errorMessage(err: unknown): string {
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue?.path?.join(".");
    return issue ? (field ? `${field}: ${issue.message}` : issue.message) : "Invalid input";
  }
  if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
    return "This already exists (duplicate).";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export class UserError extends Error {}

/**
 * Wraps a mutation: checks the session, connects to Mongo, runs the work,
 * refreshes every page, and turns errors into { ok: false, error }.
 */
export async function mutate<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    await requireAuth();
    await dbConnect();
    const data = await fn();
    revalidatePath("/", "layout");
    return { ok: true, data } as ActionResult<T>;
  } catch (err) {
    if (!(err instanceof UserError) && !(err instanceof ZodError)) console.error("[action]", err);
    return { ok: false, error: errorMessage(err) };
  }
}

/** Same as mutate() but read-only: no revalidation. */
export async function query<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    await requireAuth();
    await dbConnect();
    const data = await fn();
    return { ok: true, data } as ActionResult<T>;
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}
