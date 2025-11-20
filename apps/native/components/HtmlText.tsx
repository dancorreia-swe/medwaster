import React from "react";
import { useWindowDimensions, View } from "react-native";
import RenderHtml from "react-native-render-html";
import { useColorScheme } from "@/lib/use-color-scheme";

interface HtmlTextProps {
  html: string;
  className?: string;
  baseStyle?: any;
}

export function HtmlText({ html, baseStyle }: HtmlTextProps) {
  const { width } = useWindowDimensions();
  const { isDarkColorScheme } = useColorScheme();
  const defaultColor = isDarkColorScheme ? "#E5E7EB" : "#111827";

  const defaultStyle = {
    body: {
      fontSize: 28,
      fontWeight: "700",
      color: defaultColor,
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
