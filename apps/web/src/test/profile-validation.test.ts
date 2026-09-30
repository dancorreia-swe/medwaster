import { describe, expect, test } from "vitest";
import {
  NAME_MAX_LENGTH,
  normalizeEmail,
  normalizeName,
  validateCurrentPassword,
  validateDisplayName,
  validateNewEmail,
  validateNewPassword,
  validatePasswordChange,
  validateVerificationToken,
} from "../features/profile/lib/validation";

describe("profile validation", () => {
  describe("normalizeName", () => {
    test("trims and collapses whitespace", () => {
      expect(normalizeName("  Ana   Paula  ")).toBe("Ana Paula");
    });
  });

  describe("validateDisplayName", () => {
    test("accepts a regular name", () => {
      expect(validateDisplayName("Ana Paula Ferreira")).toBeNull();
    });

    test("rejects empty or whitespace-only names", () => {
      expect(validateDisplayName("")).toBe("Informe seu nome.");
      expect(validateDisplayName("   ")).toBe("Informe seu nome.");
    });

    test("rejects names above the server limit", () => {
      expect(validateDisplayName("a".repeat(NAME_MAX_LENGTH + 1))).toContain(
        String(NAME_MAX_LENGTH),
      );
    });

    test("measures length after normalization", () => {
      expect(
        validateDisplayName(`  ${"a".repeat(NAME_MAX_LENGTH)}  `),
      ).toBeNull();
    });
  });

  describe("validateNewEmail", () => {
    test("accepts a valid address", () => {
      expect(validateNewEmail("novo@medwaster.com", "atual@medwaster.com")).toBeNull();
    });

    test("rejects an empty value", () => {
      expect(validateNewEmail("", "atual@medwaster.com")).toBe(
        "Informe o novo email.",
      );
    });

    test("rejects a malformed address", () => {
      expect(validateNewEmail("nao-e-email", "atual@medwaster.com")).toBe(
        "Informe um email válido.",
      );
    });

    test("rejects the current address, ignoring case and spacing", () => {
      expect(validateNewEmail("  Atual@Medwaster.com ", "atual@medwaster.com")).toBe(
        "O novo email deve ser diferente do atual.",
      );
    });

    test("normalizes addresses to lowercase", () => {
      expect(normalizeEmail(" Novo@Medwaster.COM ")).toBe("novo@medwaster.com");
    });
  });

  describe("validateCurrentPassword", () => {
    test("requires a value", () => {
      expect(validateCurrentPassword("")).toBe("Informe sua senha atual.");
      expect(validateCurrentPassword("qualquer-senha")).toBeNull();
    });
  });

  describe("validateVerificationToken", () => {
    test("requires a non-blank code", () => {
      expect(validateVerificationToken("   ")).toBe(
        "Informe o código enviado para o novo email.",
      );
      expect(validateVerificationToken("abc-123")).toBeNull();
    });
  });

  describe("validateNewPassword", () => {
    test("accepts a password meeting every rule", () => {
      expect(validateNewPassword("SenhaForte1")).toBeNull();
    });

    test("enforces the minimum length required by the server", () => {
      expect(validateNewPassword("Ab1cdef")).toBe(
        "A senha deve ter pelo menos 8 caracteres.",
      );
    });

    test("requires upper case, lower case and digits", () => {
      expect(validateNewPassword("senhafraca1")).toBe(
        "A senha deve conter pelo menos uma letra maiúscula.",
      );
      expect(validateNewPassword("SENHAFRACA1")).toBe(
        "A senha deve conter pelo menos uma letra minúscula.",
      );
      expect(validateNewPassword("SenhaFraca")).toBe(
        "A senha deve conter pelo menos um número.",
      );
    });
  });

  describe("validatePasswordChange", () => {
    test("returns no errors for a valid change", () => {
      expect(
        validatePasswordChange({
          currentPassword: "SenhaAntiga1",
          newPassword: "SenhaNova1",
          confirmPassword: "SenhaNova1",
        }),
      ).toEqual({});
    });

    test("flags every empty field", () => {
      expect(
        validatePasswordChange({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }),
      ).toEqual({
        currentPassword: "Informe sua senha atual.",
        newPassword: "Informe a nova senha.",
        confirmPassword: "Confirme a nova senha.",
      });
    });

    test("rejects reusing the current password", () => {
      const errors = validatePasswordChange({
        currentPassword: "SenhaNova1",
        newPassword: "SenhaNova1",
        confirmPassword: "SenhaNova1",
      });

      expect(errors.newPassword).toBe(
        "A nova senha deve ser diferente da senha atual.",
      );
    });

    test("rejects a mismatched confirmation", () => {
      const errors = validatePasswordChange({
        currentPassword: "SenhaAntiga1",
        newPassword: "SenhaNova1",
        confirmPassword: "SenhaNova2",
      });

      expect(errors.confirmPassword).toBe("As senhas não correspondem.");
      expect(errors.newPassword).toBeUndefined();
    });
  });
});
