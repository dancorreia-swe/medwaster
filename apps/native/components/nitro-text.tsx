/**
 * Platform entry point for the rich text component.
 *
 * `react-native-nitro-text` is a Nitro *host component*: `getHostComponent()`
 * binds it to a native iOS/Android view, so it has no web implementation. On top
 * of that, the published package is unusable on web for a second reason — its
 * `main`/`module` builds (`lib/commonjs`, `lib/module`) keep the source-relative
 * import `../nitrogen/generated/shared/json/NitroTextConfig.json`, which resolves
 * to `lib/nitrogen/...` and is not shipped. Only the `react-native`/`source`
 * field (`src/index`) resolves correctly, and Metro consults that field for
 * native platforms only, so a web bundle fails to resolve the module.
 *
 * Keeping the import behind this module means web resolves `./nitro-text.web`
 * and never pulls the package into the bundle at all.
 */
export { NitroText } from "react-native-nitro-text";
