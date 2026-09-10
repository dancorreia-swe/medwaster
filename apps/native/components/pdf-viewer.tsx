/**
 * Platform entry point for the external-article PDF viewer.
 *
 * `react-native-pdf` renders through a Fabric native component: its entry pulls
 * in `react-native/Libraries/Utilities/codegenNativeComponent`, a react-native
 * internal that Metro refuses to bundle for web. Keeping the import behind this
 * module means a web bundle resolves `./pdf-viewer.web` and never reaches the
 * package. See ./pdf-viewer.web.tsx for the browser implementation.
 */
export { default as PdfViewer } from "react-native-pdf";
