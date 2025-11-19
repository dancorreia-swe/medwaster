import { createFileRoute } from "@tanstack/react-router";
import { certificateVerificationQueryOptions } from "@/features/certificates/api/certificatesQueries";
import { CertificateVerificationPage } from "@/features/certificates/components/certificate-verification-page";

export const Route = createFileRoute("/verify/certificate/$code")({
  loader: async ({ params, context: { queryClient } }) => {
    return queryClient.ensureQueryData(
      certificateVerificationQueryOptions(params.code),
    );
  },
  component: CertificateVerificationRoute,
});

function CertificateVerificationRoute() {
  const { code } = Route.useParams();
  const result = Route.useLoaderData();

  return <CertificateVerificationPage code={code} result={result} />;
}
