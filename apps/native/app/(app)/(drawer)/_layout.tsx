import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Drawer } from "expo-router/drawer";

const DrawerLayout = () => {
  return (
    <Drawer initialRouteName="dev-home">
      <Drawer.Screen
        name="dev-home"
        options={{
          headerTitle: "Dev-Home",
          drawerLabel: "Home",
          drawerIcon: ({ size, color }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          headerShown: false,
          drawerLabel: "Dashboard",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="tutor-chat"
        options={{
          headerShown: false,
          drawerLabel: "Tutor Chat",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="chat" size={size} color={color} />
          ),
        }}
      />
    </Drawer>
  );
};

export default DrawerLayout;
