import * as LucideIcons from "lucide-react-native";
import { Trophy } from "lucide-react-native";

/**
 * Convert kebab-case icon name to PascalCase and get the Lucide icon component
 * Examples: "trophy" -> Trophy, "check-circle" -> CheckCircle, "star" -> Star
 */
export function getLucideIcon(iconName: string): typeof Trophy {
  if (!iconName) return Trophy;

  // Convert kebab-case to PascalCase
  const pascalCase = iconName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  // Get the icon from lucide-react-native
  const Icon = (LucideIcons as any)[pascalCase];

  // Fallback to Trophy if icon not found
  return Icon || Trophy;
}
