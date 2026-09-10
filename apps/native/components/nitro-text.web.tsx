import { Text, type TextProps } from "react-native";

/**
 * Web fallback for `NitroText` (see ./nitro-text.tsx for why one is needed).
 *
 * react-native-web's `Text` already renders selectable text in the browser, so
 * the fallback keeps the props the app actually uses (`selectable`, `style`,
 * `numberOfLines`, children) and drops the iOS/Android-only Nitro extras.
 */
export function NitroText(props: TextProps) {
  return <Text {...props} />;
}
