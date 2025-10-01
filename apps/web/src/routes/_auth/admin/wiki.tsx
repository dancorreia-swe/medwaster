import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/admin/wiki")({
  component: WikiAdminLayout,
});

function WikiAdminLayout() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Wiki Management</h1>
        <p className="text-slate-600 mt-1">
          Manage educational content and knowledge base articles
        </p>
      </div>
      <Outlet />
    </div>
  );
}