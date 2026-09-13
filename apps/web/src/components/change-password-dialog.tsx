import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
  validatePasswordChange,
  type PasswordChangeErrors,
} from "@/features/profile/lib/validation";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<PasswordChangeErrors>({});

  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const clearError = (field: keyof PasswordChangeErrors) => {
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validatePasswordChange({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setErrors(validationErrors);

    if (Object.values(validationErrors).some(Boolean)) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });

        if (response.error) {
          throw new Error(response.error.message || "Erro ao alterar senha");
        }

        toast.success("Senha alterada com sucesso!");
        handleClose();
      } catch (error) {
        console.error("Error changing password:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Erro ao alterar senha. Verifique sua senha atual.";
        setErrors({ currentPassword: message });
        toast.error(message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <DialogDescription>
            Digite sua senha atual e escolha uma nova senha segura. As outras
            sessões serão encerradas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha atual</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  clearError("currentPassword");
                }}
                disabled={isPending}
                autoComplete="current-password"
                className="pr-10"
                aria-invalid={errors.currentPassword ? true : undefined}
                aria-describedby={
                  errors.currentPassword ? "current-password-error" : undefined
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isPending}
                aria-label={
                  showCurrentPassword ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {showCurrentPassword ? (
                  <EyeOff
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </div>
            {errors.currentPassword ? (
              <p
                id="current-password-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.currentPassword}
              </p>
            ) : null}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearError("newPassword");
                }}
                disabled={isPending}
                autoComplete="new-password"
                className="pr-10"
                aria-invalid={errors.newPassword ? true : undefined}
                aria-describedby={
                  errors.newPassword ? "new-password-error" : "new-password-hint"
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isPending}
                aria-label={showNewPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showNewPassword ? (
                  <EyeOff
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </div>
            {errors.newPassword ? (
              <p
                id="new-password-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.newPassword}
              </p>
            ) : (
              <p id="new-password-hint" className="text-xs text-muted-foreground">
                Mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearError("confirmPassword");
                }}
                disabled={isPending}
                autoComplete="new-password"
                className="pr-10"
                aria-invalid={errors.confirmPassword ? true : undefined}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isPending}
                aria-label={
                  showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </Button>
            </div>
            {errors.confirmPassword ? (
              <p
                id="confirm-password-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.confirmPassword}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar senha"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
