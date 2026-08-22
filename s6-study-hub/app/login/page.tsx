import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata = { title: "Log in — S6 Study Hub" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-2xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-1 text-sm text-slate">Log in to continue your UACE revision.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-slate">
        New here?{" "}
        <Link href="/register" className="font-medium text-marker-green underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
