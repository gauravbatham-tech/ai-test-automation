import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">AI QA Platform</h1>

      <p className="text-gray-500">
        AI-powered end-to-end testing automation.
      </p>

      <div className="flex gap-4">
        <SignInButton mode="modal">
          <button className="rounded-lg border px-5 py-2">
            Sign In
          </button>
        </SignInButton>

        <SignUpButton mode="modal">
          <button className="rounded-lg bg-black px-5 py-2 text-white">
            Sign Up
          </button>
        </SignUpButton>
      </div>
    </main>
  );
}