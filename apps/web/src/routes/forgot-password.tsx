import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { authClient } from "@/lib/auth-client";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PillBottleIcon } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: RouteComponent,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();

    if (session) {
      throw redirect({ to: "/" });
    }
  },
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-14 px-6 py-16">
        <div className="flex items-center gap-2 text-xl font-normal text-slate-900">
          <PillBottleIcon className="h-5 w-5" />
          <span className="font-medium">MedWaster</span>
        </div>

        <div className="flex w-full justify-center">
          <ForgotPasswordForm />
        </div>

        <p className="text-sm text-slate-500">© 2025 MynaUI</p>
      </div>
    </div>
  );
}
