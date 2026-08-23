import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
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
        <AuthForm action={signIn} submitLabel="Log in" />
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        No account yet?{" "}
        <Link href="/signup" className="font-semibold text-slate-900 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
