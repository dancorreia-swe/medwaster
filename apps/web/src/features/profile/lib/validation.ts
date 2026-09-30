/**
 * Validation helpers for the account management surface (profile + settings).
 *
 * Kept free of React/DOM so the rules can be unit tested and reused by the
 * profile page, the account settings page and the change password dialog.
 * Limits mirror the server contract in `modules/profile/model.ts`.
 */

export const NAME_MAX_LENGTH = 255;
export const PASSWORD_MIN_LENGTH = 8;

/** Collapses repeated whitespace so " Ana   Paula " becomes "Ana Paula". */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateDisplayName(value: string): string | null {
  const name = normalizeName(value);

  if (!name) {
    return "Informe seu nome.";
  }

  if (name.length > NAME_MAX_LENGTH) {
    return `O nome deve ter no máximo ${NAME_MAX_LENGTH} caracteres.`;
  }

  return null;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateNewEmail(
  value: string,
  currentEmail?: string | null,
): string | null {
  const email = normalizeEmail(value);

  if (!email) {
    return "Informe o novo email.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Informe um email válido.";
  }

  if (currentEmail && email === normalizeEmail(currentEmail)) {
    return "O novo email deve ser diferente do atual.";
  }

  return null;
}

export function validateCurrentPassword(value: string): string | null {
  if (!value) {
    return "Informe sua senha atual.";
  }

  return null;
}

export function validateVerificationToken(value: string): string | null {
  if (!value.trim()) {
    return "Informe o código enviado para o novo email.";
  }

  return null;
}

export function validateNewPassword(value: string): string | null {
  if (!value) {
    return "Informe a nova senha.";
  }

  if (value.length < PASSWORD_MIN_LENGTH) {
    return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }

  if (!/[A-Z]/.test(value)) {
    return "A senha deve conter pelo menos uma letra maiúscula.";
  }

  if (!/[a-z]/.test(value)) {
    return "A senha deve conter pelo menos uma letra minúscula.";
  }

  if (!/[0-9]/.test(value)) {
    return "A senha deve conter pelo menos um número.";
  }

  return null;
}

export interface PasswordChangeInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type PasswordChangeErrors = Partial<
  Record<keyof PasswordChangeInput, string>
>;

export function validatePasswordChange(
  input: PasswordChangeInput,
): PasswordChangeErrors {
  const errors: PasswordChangeErrors = {};

  const currentPasswordError = validateCurrentPassword(input.currentPassword);
  if (currentPasswordError) {
    errors.currentPassword = currentPasswordError;
  }

  const newPasswordError = validateNewPassword(input.newPassword);
  if (newPasswordError) {
    errors.newPassword = newPasswordError;
  } else if (input.newPassword === input.currentPassword) {
    errors.newPassword = "A nova senha deve ser diferente da senha atual.";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirme a nova senha.";
  } else if (input.confirmPassword !== input.newPassword) {
    errors.confirmPassword = "As senhas não correspondem.";
  }

  return errors;
}
