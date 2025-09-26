import SignInForm from "@/components/sign-in-form";
import { createFileRoute } from "@tanstack/react-router";
import { PillBottleIcon } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-10 px-6 py-16">
        <div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <span className="flex items-center gap-2">
            <PillBottleIcon />
            MedWaster
          </span>
        </div>

        <div className="flex w-full justify-center">
          <SignInForm />
        </div>

        <p className="text-sm text-slate-500">© 2025 MedWaster</p>
      </div>
    </div>
  );
}
