import React from "react";
import { useWindowDimensions, View } from "react-native";
import RenderHtml from "react-native-render-html";

interface HtmlTextProps {
  html: string;
  className?: string;
  baseStyle?: any;
}

export function HtmlText({ html, baseStyle }: HtmlTextProps) {
  const { width } = useWindowDimensions();

  const defaultStyle = {
    body: {
      fontSize: 28,
      fontWeight: "700",
      color: "#111827",
      lineHeight: 36,
      ...baseStyle,
    },
    p: {
      margin: 0,
      padding: 0,
    },
  };

  return (
    <View className="mb-12">
      <RenderHtml
        contentWidth={width}
        source={{ html: html || "" }}
        tagsStyles={defaultStyle}
      />
    </View>
  );
}
