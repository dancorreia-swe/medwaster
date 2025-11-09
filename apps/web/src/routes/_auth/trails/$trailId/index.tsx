import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/trails/$trailId/")({
  component: () => {
    const { trailId } = Route.useParams();
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Trail Details</h1>
        <p>Trail ID: {trailId}</p>
        <p className="text-muted-foreground">
          Detailed trail view coming soon...
        </p>
      </div>
    );
  },
});
