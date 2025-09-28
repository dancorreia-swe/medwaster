import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Global sign out utility function
 * Handles user authentication logout with success feedback
 *
 * @returns Promise that resolves when logout is complete
 */
export async function signOut(): Promise<void> {
  try {
    await authClient.signOut();
    toast.success("Deslogado com sucesso");
  } catch (error) {
    console.error("Error during sign out:", error);
    toast.error("Erro ao fazer logout");

    throw error;
  }
}
