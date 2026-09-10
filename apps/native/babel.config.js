/**
 * Rewrite `import.meta` to an empty object.
 *
 * Metro serves web bundles as classic scripts, where `import.meta` is a hard
 * parse error — the whole bundle fails to evaluate and the page renders blank.
 * zustand's `devtools` middleware reads `import.meta.env.MODE`, and it reaches
 * the bundle through the `zustand/middleware` barrel that `lib/stores/
 * article-store.ts` imports `persist` from, so it cannot be tree-shaken away.
 *
 * `import.meta.env` is a bundler convention (Vite) that Metro does not
 * implement, so the correct value here is "absent": `devtools` then reads
 * `undefined` for MODE and behaves exactly as it does on native.
 */
function transformImportMeta({ types: t }) {
  return {
    name: "transform-import-meta",
    visitor: {
      MetaProperty(path) {
        if (
          path.node.meta.name === "import" &&
          path.node.property.name === "meta"
        ) {
          path.replaceWith(t.objectExpression([]));
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  const plugins = [];

  plugins.push(transformImportMeta);
  plugins.push("react-native-reanimated/plugin");

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins,
  };
};
