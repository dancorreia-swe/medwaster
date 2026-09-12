import { useCallback, useEffect, useRef, useState } from "react";
import { certificatesApi, type CertificateDesignPayload } from "../../api";

const PREVIEW_DEBOUNCE_MS = 400;

export type CertificatePreviewStatus = "loading" | "ready" | "error";

/**
 * Server-rendered PDF preview of an unsaved Certificate Design.
 * Re-renders 400ms after the design stops changing, aborts in-flight
 * requests and revokes object URLs after the preview panel removes them.
 */
export function useCertificatePreview(
  design: CertificateDesignPayload,
  enabled: boolean,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<CertificatePreviewStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const urlsRef = useRef(new Set<string>());
  const hasRequested = useRef(false);
  const requestKey = JSON.stringify(design);

  const releaseUrl = useCallback((urlToRelease: string) => {
    if (!urlsRef.current.delete(urlToRelease)) return;
    URL.revokeObjectURL(urlToRelease);
  }, []);

  useEffect(() => {
    if (!enabled) {
      // A pending re-render was cancelled: the last PDF is current again.
      setStatus((current) =>
        current === "loading" && urlsRef.current.size > 0 ? "ready" : current,
      );
      return;
    }

    const controller = new AbortController();
    const delay = hasRequested.current ? PREVIEW_DEBOUNCE_MS : 0;
    setStatus("loading");

    const timer = window.setTimeout(async () => {
      hasRequested.current = true;
      try {
        const blob = await certificatesApi.renderCertificateDesignPreview(
          JSON.parse(requestKey) as CertificateDesignPayload,
          controller.signal,
        );
        if (controller.signal.aborted) return;

        const nextUrl = URL.createObjectURL(blob);
        urlsRef.current.add(nextUrl);
        setUrl(nextUrl);
        setError(null);
        setStatus("ready");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível gerar a prévia do certificado",
        );
        setStatus("error");
      }
    }, delay);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey, enabled, retryCount]);

  useEffect(
    () => () => {
      for (const previewUrl of urlsRef.current) {
        URL.revokeObjectURL(previewUrl);
      }
      urlsRef.current.clear();
    },
    [],
  );

  return {
    url,
    status,
    error,
    releaseUrl,
    retry: () => setRetryCount((count) => count + 1),
  };
}
