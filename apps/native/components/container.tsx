import React from "react";
import { View } from "react-native";
import {
  SafeAreaView,
  SafeAreaViewProps,
} from "react-native-safe-area-context";

type ContainerProps = {
  children: React.ReactNode;
} & SafeAreaViewProps;

export const Container = ({ children, ...props }: ContainerProps) => {
  return (
    <SafeAreaView
      className="flex-1 bg-background"
      {...props}
    >
      {children}
    </SafeAreaView>
  );
};
