import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { signIn } from "@/app/auth/actions";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Log in
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Welcome back — pick up where you left off.
      </p>

      <div className="mt-6">
        <GoogleSignInButton />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        OR
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <AuthForm action={signIn} submitLabel="Log in" />

      <p className="mt-6 text-center text-sm text-slate-500">
        No account yet?{" "}
        <Link href="/signup" className="font-semibold text-slate-900 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
