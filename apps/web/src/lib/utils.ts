import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import Color from "color";

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

export function formatDate(value?: Date | string | null) {
  if (!value) return "-";

  const date = typeof value === "string" ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function randomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.random() * 30;
  const lightness = 40 + Math.random() * 20;

  return Color.hsl(hue, saturation, lightness).hex();
}

/**
 * Strips HTML tags from a string and decodes HTML entities
 * Useful for displaying rich text content as plain text
 *
 * @param html - The HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  // Create a temporary element to parse HTML
  const tmp = document.createElement("div");
  tmp.innerHTML = html;

  // Get text content (automatically decodes HTML entities)
  return tmp.textContent || tmp.innerText || "";
}
