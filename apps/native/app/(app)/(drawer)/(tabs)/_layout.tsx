import {
  MessageCircle,
  Route,
  BookOpen,
  House,
  User,
} from "lucide-react-native";
import { useColorScheme } from "@/lib/use-color-scheme";
import { Tabs } from "expo-router";

export default function TabLayout() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDarkColorScheme
          ? "hsl(217.2 91.2% 59.8%)"
          : "hsl(221.2 83.2% 53.3%)",
        tabBarInactiveTintColor: isDarkColorScheme
          ? "hsl(215 20.2% 65.1%)"
          : "hsl(215.4 16.3% 46.9%)",
        tabBarStyle: {
          paddingTop: 4,
          backgroundColor: isDarkColorScheme
            ? "hsl(222.2 84% 4.9%)"
            : "hsl(0 0% 100%)",
          borderTopColor: isDarkColorScheme
            ? "hsl(217.2 32.6% 17.5%)"
            : "hsl(214.3 31.8% 91.4%)",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <House color={color} />,
        }}
      />
      <Tabs.Screen
        name="trails"
        options={{
          title: "Trilhas",
          tabBarIcon: ({ color }) => <Route color={color} />,
        }}
      />

      <Tabs.Screen
        name="(tutor-chat)"
        options={{
          title: "Tutor",
          tabBarIcon: ({ color }) => <MessageCircle color={color} />,
          tabBarStyle: { display: "none" },
          animation: "shift",
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Wiki",
          tabBarIcon: ({ color }) => <BookOpen color={color} />,
        }}
      />
      <Tabs.Screen
        name="four"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
