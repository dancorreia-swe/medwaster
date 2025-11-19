import { SignInForm } from "@/features/auth/components/sign-in-form";
import { authClient } from "@/lib/auth-client";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PillBottleIcon } from "lucide-react";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";

const loginSearch = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: zodValidator(loginSearch),

  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();

    if (session) {
      throw redirect({ to: "/" });
    }
  },
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-10 px-6 py-16">
        <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
          <span className="flex items-center gap-2">
            <PillBottleIcon />
            MedWaster
          </span>
        </div>

        <div className="flex w-full justify-center">
          <SignInForm />
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-400">© 2025 MedWaster</p>
      </div>
    </div>
  );
}
