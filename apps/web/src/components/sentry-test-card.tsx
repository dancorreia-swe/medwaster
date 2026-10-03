import { useState } from "react";
import { Bug } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getApiUrl } from "@/lib/env";
import { Sentry } from "@/lib/sentry";

/**
 * Super-admin diagnostics: triggers test errors so the Sentry setup can be
 * verified after a deploy. Each click creates one issue in Sentry.
 */
export function SentryTestCard() {
  const [isCallingApi, setIsCallingApi] = useState(false);
  const enabled = Sentry.isEnabled();

  const throwWebError = () => {
    // Thrown from an event handler on purpose: it is reported by Sentry's
    // global error handler, exactly like a real bug would be.
    throw new Error("Sentry test error from the web admin panel");
  };

  const triggerApiError = async () => {
    setIsCallingApi(true);
    try {
      const response = await fetch(
        `${getApiUrl()}/api/admin/debug/sentry-error`,
        { credentials: "include" },
      );
      toast.info(`API respondeu ${response.status} (esperado: 500)`);
    } catch {
      toast.error("Não foi possível contatar a API");
    } finally {
      setIsCallingApi(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Diagnóstico (Sentry)</CardTitle>
        <CardDescription>
          {enabled
            ? "Gera erros de teste para confirmar que o monitoramento está funcionando."
            : "Sentry está desativado neste ambiente (VITE_SENTRY_DSN não definido). O erro da API ainda é enviado se o servidor tiver SENTRY_DSN."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={throwWebError}>
          <Bug className="size-4" aria-hidden="true" />
          Erro de teste no painel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={triggerApiError}
          disabled={isCallingApi}
        >
          <Bug className="size-4" aria-hidden="true" />
          Erro de teste na API
        </Button>
      </CardContent>
    </Card>
  );
}
