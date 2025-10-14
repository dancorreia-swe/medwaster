import { clsx, type ClassValue } from "clsx";
import { cssInterop } from "nativewind";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function iconWithClassName(icon: any) {
  cssInterop(icon, {
    className: {
      target: "style",
      nativeStyleToProp: {
        color: true,
        opacity: true,
        width: true,
        height: true,
      },
    },
  });
}

/**
 * Generates user initials from a full name
 * @param name - The full name of the user
 * @returns Initials (e.g., "John Doe" -> "JD", "Alice" -> "AL")
 */
export function getUserInitials(name: string | null | undefined): string {
  const fullName = name?.trim() || "User";
  const names = fullName.split(" ").filter(Boolean);
  
  if (names.length >= 2) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  
  return fullName.substring(0, 2).toUpperCase();
}
