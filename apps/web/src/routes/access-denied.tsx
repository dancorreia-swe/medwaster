import {
  useSearch,
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";
import { AlertTriangle, Smartphone, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { getRoleDisplayName } from "@/lib/rbac";
import { signOut } from "@/lib/utils";

export const Route = createFileRoute("/access-denied")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const search = useSearch({
    strict: false,
  });
  const { data: session } = authClient.useSession();

  const isUserRole = search.userRole === "user";
  const errorMessage = search.message || "Acesso negado ao painel web.";

  const handleLogout = async () => {
    await signOut();

    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-slate-900">
            Acesso Negado ao Painel Web
          </CardTitle>
          <CardDescription className="text-lg">{errorMessage}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* User Role Information */}
          {session?.user && (
            <div className="bg-slate-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Usuário atual:
                  </p>
                  <p className="text-slate-700">
                    {session.user.name || session.user.email}
                  </p>
                </div>
                <Badge variant="outline" className="bg-white">
                  {getRoleDisplayName(session.user.role)}
                </Badge>
              </div>
            </div>
          )}

          {/* Instructions for User Role */}
          {isUserRole && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Smartphone className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-blue-900">
                  Use o Aplicativo Móvel
                </h3>
              </div>
              <div className="space-y-3 text-blue-800">
                <p>
                  Como usuário regular, você deve acessar o MedWaster através do
                  aplicativo móvel:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Acesso a todas as questões de medicina</li>
                  <li>Acompanhamento do seu progresso</li>
                  <li>Estatísticas detalhadas de desempenho</li>
                  <li>Interface otimizada para dispositivos móveis</li>
                </ul>
                <div className="mt-4 p-3 bg-blue-100 rounded border">
                  <p className="text-sm font-medium">
                    📱 Baixe o aplicativo MedWaster na App Store ou Google Play
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions for Other Roles */}
          {!isUserRole && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-2">
                Acesso Administrativo Necessário
              </h3>
              <p className="text-amber-800">
                O painel web é exclusivo para administradores e super
                administradores. Entre em contato com um administrador do
                sistema para obter as permissões adequadas.
              </p>
            </div>
          )}

          {/* Administrator Contact */}
          <div className="bg-slate-100 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-2">
              Precisa de acesso administrativo?
            </h4>
            <p className="text-slate-600 text-sm">
              Entre em contato com um super administrador para solicitar
              permissões de acesso ao painel web. Apenas profissionais
              autorizados podem gerenciar o sistema através desta interface.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={handleLogout} variant="outline" className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Fazer Logout
            </Button>

            {isUserRole && (
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Smartphone className="w-4 h-4 mr-2" />
                Baixar App Móvel
              </Button>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-slate-500 pt-4 border-t">
            MedWaster Learning Platform - Painel Administrativo
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
