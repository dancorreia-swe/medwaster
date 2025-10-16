import React from "react";
import { View } from "react-native";
import {
  SafeAreaView,
  SafeAreaViewProps,
} from "react-native-safe-area-context";

type ContainerProps = {
  children: React.ReactNode;
  edges?: ("top" | "right" | "bottom" | "left")[];
} & Omit<SafeAreaViewProps, "edges">;

export const Container = ({ children, edges = ["top"], ...props }: ContainerProps) => {
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={edges}
      {...props}
    >
      {children}
    </SafeAreaView>
  );
};
