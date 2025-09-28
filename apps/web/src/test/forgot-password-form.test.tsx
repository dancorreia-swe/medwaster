import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ForgotPasswordForm } from "../features/auth/components/forgot-password-form";

// Mock the auth client
const mockRequestPasswordReset = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    requestPasswordReset: mockRequestPasswordReset,
  },
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock router
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should render forgot password form", () => {
    render(<ForgotPasswordForm />);
    
    expect(screen.getByText("Resete sua senha")).toBeInTheDocument();
    expect(screen.getByText("Digite seu endereço de e-mail e enviaremos um link para redefinir sua senha.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar email de redefinição/i })).toBeInTheDocument();
  });

  test("should validate email input", async () => {
    render(<ForgotPasswordForm />);
    
    const submitButton = screen.getByRole("button", { name: /enviar email de redefinição/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Email inválido")).toBeInTheDocument();
    });
  });

  test("should submit form with valid email", async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({});
    
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText("Email");
    const submitButton = screen.getByRole("button", { name: /enviar email de redefinição/i });
    
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith({
        email: "test@example.com",
        redirectTo: "http://localhost:3000/reset-password",
      });
    });
  });

  test("should show success state after email sent", async () => {
    mockRequestPasswordReset.mockResolvedValueOnce({});
    
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    
    const submitButton = screen.getByRole("button", { name: /enviar email de redefinição/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Verifique seu email!")).toBeInTheDocument();
      expect(screen.getByText(/enviamos um link mágico/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reenviar email/i })).toBeInTheDocument();
    });
  });

  test("should handle API errors", async () => {
    const mockError = new Error("SMTP Error");
    mockRequestPasswordReset.mockRejectedValueOnce(mockError);
    
    const { toast } = await import("sonner");
    
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText("Email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    
    const submitButton = screen.getByRole("button", { name: /enviar email de redefinição/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("SMTP Error");
    });
  });

  test("should show back to login link", () => {
    render(<ForgotPasswordForm />);
    
    const backLink = screen.getByRole("link", { name: /voltar ao login/i });
    expect(backLink).toBeInTheDocument();
    expect(backLink).toHaveAttribute("href", "/login");
  });
});