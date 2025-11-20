import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TrailDetailPage } from "@/features/trails/pages/trail-detail-page";
import { trailQueryOptions } from "@/features/trails/api/trailsQueries";
import { buildPageHead } from "@/lib/page-title";

export const Route = createFileRoute("/_auth/trails/$trailId/")({
  head: ({ params }) => buildPageHead(`Trilha ${params.trailId}`),
  loader: ({ context: { queryClient }, params: { trailId } }) => {
    const numericTrailId = Number(trailId);
    if (Number.isNaN(numericTrailId)) {
      throw new Error("Invalid trail ID");
    }
    return queryClient.ensureQueryData(trailQueryOptions(numericTrailId));
  },
  component: RouteComponent,
  beforeLoad: ({ params }) => ({
    getTitle: () => `Trilha ${params.trailId}`,
  }),
});

function RouteComponent() {
  const { trailId } = Route.useParams();
  const numericTrailId = Number(trailId);

  const { data: trailData, isLoading, error } = useQuery(
    trailQueryOptions(numericTrailId)
  );

  if (Number.isNaN(numericTrailId)) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>ID da trilha inválido.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Erro ao carregar trilha. Tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !trailData) {
    return <TrailDetailPage trail={{} as any} isLoading={true} />;
  }

  // Handle nested data structure from API
  const trail = (trailData as any)?.data || trailData;

  return <TrailDetailPage trail={trail} />;
}
