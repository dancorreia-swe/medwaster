import { createElement, type ReactNode } from "react";
import { View } from "react-native";

type PdfViewerProps = {
  source?: { uri?: string; cache?: boolean } | null;
  style?: Record<string, unknown>;
  trustAllCerts?: boolean;
  renderActivityIndicator?: () => ReactNode;
  onLoadProgress?: (percent: number) => void;
  onLoadComplete?: () => void;
  onError?: (error: { message?: string }) => void;
};

/**
 * Web implementation of the PDF viewer (see ./pdf-viewer.tsx for why one is
 * needed).
 *
 * Browsers already ship a PDF renderer, so the document is handed to a native
 * `<iframe>`. `createElement` is used instead of JSX because `iframe` is a DOM
 * element rather than a react-native-web component, and the react-native
 * `style` prop is not applied to it directly.
 *
 * The native-only props (`trustAllCerts`, download progress) have no browser
 * equivalent and are accepted-and-ignored so both platforms share a call site.
 */
export function PdfViewer({
  source,
  style,
  renderActivityIndicator,
  onLoadComplete,
  onError,
}: PdfViewerProps) {
  const uri = source?.uri;

  if (!uri) {
    onError?.({ message: "PDF sem endereço de origem." });
    return <View style={style as any} />;
  }

  return (
    <View style={[{ flex: 1, width: "100%" }, style as any]}>
      {createElement("iframe", {
        src: uri,
        title: "Documento PDF",
        onLoad: () => onLoadComplete?.(),
        onError: () => onError?.({ message: "Erro ao carregar o PDF" }),
        style: { border: "none", width: "100%", height: "100%" },
      })}
    </View>
  );
}
