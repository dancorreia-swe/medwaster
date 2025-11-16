import { NitroText as Text } from "react-native-nitro-text";
import {
  View,
  TouchableOpacity,
  ScrollView,
  TextStyle,
  ViewStyle,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Container } from "@/components/container";
import { Renderer, RendererInterface, useMarkdown } from "react-native-marked";
import React, { Fragment, ReactNode } from "react";

class ReadTextRenderer extends Renderer implements RendererInterface {
  constructor() {
    super();
  }

  text(text: string | React.ReactNode[], styles?: TextStyle): React.ReactNode {
    return this.getSelectableTextNode(text, styles);
  }

  heading(text: string | React.ReactNode[], styles?: TextStyle): React.ReactNode {
      return this.getSelectableTextNode(text, styles)
  }

  private getSelectableTextNode(
    children: string | ReactNode[],
    styles?: TextStyle,
  ): ReactNode {
    return (
      <Text selectable key={this.getKey()} style={styles}>
        {children}
      </Text>
    );
  }
}

export default function TextViewer() {
  const router = useRouter();
  const { text } = useLocalSearchParams<{ text: string }>();

  const colors = React.useMemo(
    () => ({
      text: "#101828",
      link: "#3B82F6",
      code: "#101828",
      border: "rgba(255, 255, 255, 0.3)",
      background: "rgba(0, 0, 0, 0.1)",
      overlay: "rgba(255, 255, 255, 0.2)",
    }),
    [],
  );

  const elements = useMarkdown(text, {
    theme: { colors },
    renderer: new ReadTextRenderer(),
    styles: {
      text: {
        fontSize: 16,
        lineHeight: 24,
      },
      paragraph: {
        marginTop: 0,
        marginBottom: 0,
      },
      list: {
        marginTop: 0,
        marginBottom: 0,
        paddingBottom: 16,
      },
      li: {
        marginBottom: 0,
        marginTop: 0,
      },
    },
  });

  return (
    <Container className="flex-1 bg-white">
      <View className="border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-9 h-9 items-center justify-center -ml-2"
          >
            <ArrowLeft size={24} color="#101828" strokeWidth={2} />
          </TouchableOpacity>

          <Text className="text-3xl font-semibold text-neutral-800">
            Selecionar texto
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 py-6">
        {elements?.map((element, index) => (
          <View key={`markdown-${index}`}>{element}</View>
        ))}
      </ScrollView>
    </Container>
  );
}
