"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/Button";

const initialState: LoginState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Logging in…" : "Log in"}
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p role="alert" className="rounded-card bg-marker-red-soft px-3 py-2 text-sm text-marker-red">
          {state.error}
        </p>
      )}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email"
          className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password"
          className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
      </div>
      <SubmitButton />
    </form>
  );
}
