import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/app/auth/actions";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-20 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        Sign up
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Create an account to save your scores and progress.
      </p>

      <div className="mt-6">
        <AuthForm action={signUp} submitLabel="Sign up" />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
