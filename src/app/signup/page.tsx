import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { signUp } from "@/app/auth/actions";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Sign up
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Just pick a username and password — no email needed.
      </p>

      <div className="mt-6">
        <GoogleSignInButton />
      </div>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        OR
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <AuthForm
        action={signUp}
        submitLabel="Sign up"
        identifierName="username"
        identifierLabel="Username"
      />

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
