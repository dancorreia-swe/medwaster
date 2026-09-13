import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { CertificatePreviewStatus } from "./use-certificate-preview";

/** Fallback in case a browser never fires `load` for a PDF iframe. */
const SWAP_FALLBACK_MS = 2500;

const viewerSrc = (url: string) => `${url}#toolbar=0&navpanes=0&view=Fit`;

export function CertificatePreviewPanel({
  url,
  status,
  error,
  paused,
  onRetry,
  onUrlRemoved,
}: {
  url: string | null;
  status: CertificatePreviewStatus;
  error: string | null;
  /** True while the draft is invalid and the preview is not re-rendering. */
  paused: boolean;
  onRetry: () => void;
  /** Releases a preview URL after its iframe has left the document. */
  onUrlRemoved?: (url: string) => void;
}) {
  // Keep the last loaded PDF on screen until the next one has loaded in a
  // hidden iframe, so each update swaps in place instead of flashing.
  const [shownUrl, setShownUrl] = useState<string | null>(null);
  const incomingUrl = url && url !== shownUrl ? url : null;
  const previousShownUrl = useRef<string | null>(null);
  const previousIncomingUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!incomingUrl) return;
    const timer = window.setTimeout(
      () => setShownUrl(incomingUrl),
      SWAP_FALLBACK_MS,
    );
    return () => window.clearTimeout(timer);
  }, [incomingUrl]);

  useEffect(() => {
    const previousUrl = previousShownUrl.current;
    if (previousUrl && previousUrl !== shownUrl) {
      onUrlRemoved?.(previousUrl);
    }
    previousShownUrl.current = shownUrl;
  }, [shownUrl, onUrlRemoved]);

  useEffect(() => {
    const previousUrl = previousIncomingUrl.current;
    if (
      previousUrl &&
      previousUrl !== incomingUrl &&
      previousUrl !== shownUrl
    ) {
      onUrlRemoved?.(previousUrl);
    }
    previousIncomingUrl.current = incomingUrl;
  }, [incomingUrl, shownUrl, onUrlRemoved]);

  const frames = [shownUrl, incomingUrl].filter(
    (frameUrl): frameUrl is string => Boolean(frameUrl),
  );
  const isUpdating = status === "loading" || incomingUrl !== null;

  return (
    <section aria-labelledby="certificate-preview-heading" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-0.5">
          <h2
            id="certificate-preview-heading"
            className="text-sm font-semibold"
          >
            Prévia
          </h2>
          <p className="text-xs text-muted-foreground">
            PDF real, gerado com dados de exemplo.
          </p>
        </div>
        {url && (
          <Button variant="ghost" size="sm" asChild>
            <a href={url} target="_blank" rel="noreferrer">
              <ExternalLink />
              Abrir PDF
            </a>
          </Button>
        )}
      </div>

      <div className="relative aspect-[297/210] w-full overflow-hidden rounded-lg border bg-muted">
        {frames.map((frameUrl) => {
          const isIncoming = frameUrl === incomingUrl;
          return (
            <iframe
              key={frameUrl}
              title="Prévia do certificado em PDF"
              src={viewerSrc(frameUrl)}
              aria-hidden={isIncoming || undefined}
              tabIndex={isIncoming ? -1 : undefined}
              onLoad={isIncoming ? () => setShownUrl(frameUrl) : undefined}
              className={cn(
                "absolute inset-0 h-full w-full",
                isIncoming && "pointer-events-none opacity-0",
              )}
            />
          );
        })}

        {!shownUrl && status !== "error" && (
          <Skeleton className="absolute inset-0 rounded-none" />
        )}

        {isUpdating && shownUrl && (
          <div
            role="status"
            className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md border bg-background/95 px-2 py-1 text-xs text-muted-foreground shadow-xs"
          >
            <Loader2 className="size-3.5 animate-spin" />
            Atualizando prévia
          </div>
        )}

        {status === "error" && (
          <div className="absolute inset-x-3 bottom-3">
            <Alert variant="destructive" className="bg-background">
              <AlertTitle>Não foi possível gerar a prévia</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
                <span>{error}</span>
                <Button size="sm" variant="outline" onClick={onRetry}>
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      {paused && (
        <p className="text-xs text-muted-foreground">
          A prévia volta a atualizar quando o título for válido.
        </p>
      )}
    </section>
  );
}
