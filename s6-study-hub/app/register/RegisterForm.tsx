"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { registerAction, type RegisterState } from "./actions";
import { Button } from "@/components/ui/Button";

type SubjectCombination = { id: string; code: string; display_name: string };
type Subject = { id: string; name: string; category: string | null };
type School = { id: string; name: string; district: string | null };

const initialState: RegisterState = { error: null, needsEmailConfirmation: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Creating account…" : "Create account"}
    </Button>
  );
}

export default function RegisterForm({
  combinations,
  subjects,
  schools,
}: {
  combinations: SubjectCombination[];
  subjects: Subject[];
  schools: School[];
}) {
  const [state, formAction] = useFormState(registerAction, initialState);
  const [schoolKnown, setSchoolKnown] = useState(true);

  if (state.needsEmailConfirmation) {
    return (
      <div role="status" className="rounded-card bg-marker-green-soft px-4 py-4 text-sm text-marker-green">
        Check your email for a confirmation link to finish setting up your account.
        If you already have an account with that email, we&apos;ve sent a sign-in
        link there instead.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && (
        <p role="alert" className="rounded-card bg-marker-red-soft px-3 py-2 text-sm text-marker-red">
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium text-ink">Full name</label>
        <input id="name" name="name" required autoComplete="name"
          className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email"
          className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">Password</label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password"
          aria-describedby="password-hint"
          className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
        <p id="password-hint" className="text-xs text-slate">At least 8 characters, with a letter and a number.</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="school" className="text-sm font-medium text-ink">School</label>
          <button
            type="button"
            onClick={() => setSchoolKnown((v) => !v)}
            className="text-xs font-medium text-marker-green underline underline-offset-2"
          >
            {schoolKnown ? "My school isn't listed" : "Pick from list instead"}
          </button>
        </div>
        {schoolKnown ? (
          <select id="school" name="schoolId" required
            className="w-full rounded-card border border-ink/15 bg-white px-3 py-2.5 text-sm focus-visible:outline-marker-green">
            <option value="">Select your school</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.name}{s.district ? ` — ${s.district}` : ""}</option>
            ))}
          </select>
        ) : (
          <input id="schoolName" name="schoolName" placeholder="Type your school's name" required
            className="w-full rounded-card border border-ink/15 px-3 py-2.5 text-sm focus-visible:outline-marker-green" />
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="combination" className="text-sm font-medium text-ink">Subject combination</label>
        <select id="combination" name="subjectCombinationId" required
          className="w-full rounded-card border border-ink/15 bg-white px-3 py-2.5 text-sm focus-visible:outline-marker-green">
          <option value="">Select your combination</option>
          {combinations.map((c) => (
            <option key={c.id} value={c.id}>{c.code} — {c.display_name}</option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-ink">Preferred subjects</legend>
        <p className="text-xs text-slate">Select every subject you're studying, including your combination's subjects.</p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {subjects.map((s) => (
            <label key={s.id} className="tap-target flex items-center gap-2 rounded-card border border-ink/10 px-2.5 py-2 text-sm">
              <input type="checkbox" name="subjectIds" value={s.id} className="h-4 w-4 accent-marker-green" />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>

      <SubmitButton />
    </form>
  );
}
