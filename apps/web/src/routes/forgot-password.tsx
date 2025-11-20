import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";
import { authClient } from "@/lib/auth-client";
import { buildPageHead } from "@/lib/page-title";
import { createFileRoute, redirect } from "@tanstack/react-router";

const PAGE_TITLE = "Recuperar Senha";

export const Route = createFileRoute("/forgot-password")({
  component: RouteComponent,
  head: () => buildPageHead(PAGE_TITLE),
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();

    if (session) {
      throw redirect({ to: "/" });
    }

    return { getTitle: () => PAGE_TITLE };
  },
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-14 px-6 py-16">
        <div className="flex items-center gap-2 text-xl font-normal text-slate-900">
          <img
            src="/light-mascot.png"
            alt="MedWaster"
            className="h-7 w-7"
          />
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
