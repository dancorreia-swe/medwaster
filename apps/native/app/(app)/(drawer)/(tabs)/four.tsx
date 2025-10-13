import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Container } from "@/components/container";
import { useState } from "react";
import { ProfileHeader, StatCard, MenuItem } from "@/features/profile/components";
import {
  Settings,
  Bell,
  Award,
  HelpCircle,
  LogOut,
  Pencil,
} from "lucide-react-native";
import { Icon } from "@/components/icon";

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState<"settings" | "achievements">("settings");

  return (
    <Container className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with gradient background */}
        <ProfileHeader name="tarst" role="Médico(a)" initial="T" />

        {/* Tabs */}
        <View className="flex-row bg-gray-50 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setActiveTab("settings")}
            className={`flex-1 py-2.5 px-3.5 border-b-[1.09px] ${
              activeTab === "settings" ? "border-primary" : "border-transparent"
            }`}
          >
            <Text
              className={`text-xs font-medium text-center ${
                activeTab === "settings" ? "text-gray-900" : "text-gray-900"
              }`}
            >
              Configurações
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("achievements")}
            className={`flex-1 py-2.5 px-3.5 border-b-[1.09px] ${
              activeTab === "achievements" ? "border-primary" : "border-transparent"
            }`}
          >
            <Text
              className={`text-xs font-medium text-center ${
                activeTab === "achievements" ? "text-gray-900" : "text-gray-900"
              }`}
            >
              Conquistas
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View className="px-3.5 py-3.5 flex-row gap-3">
          <StatCard value="12" label="Certificados" color="#155DFC" />
          <StatCard value="7" label="Dias seguidos" color="#00A63E" />
          <StatCard value="92%" label="Média" color="#9810FA" />
        </View>

        {/* Professional Details Card */}
        <View className="mx-3.5 mb-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
          <View className="p-3.5">
            {/* Header with Edit button */}
            <View className="flex-row justify-between items-center mb-3.5">
              <Text className="text-sm font-semibold text-gray-900">
                Detalhes Profissionais
              </Text>
              <TouchableOpacity className="flex-row items-center gap-2">
                <Icon icon={Pencil} size={14} className="text-gray-900" />
                <Text className="text-xs font-medium text-gray-900">Editar</Text>
              </TouchableOpacity>
            </View>

            {/* Details */}
            <View className="gap-3">
              <View>
                <Text className="text-xs text-gray-500 mb-1">Instituição:</Text>
                <Text className="text-sm font-medium text-gray-900">arst</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500">Especialização:</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500">Departamento:</Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500 mb-1">Experiência:</Text>
                <Text className="text-sm font-medium text-gray-900">Menos de 1 ano</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Learning Statistics Card */}
        <View className="mx-3.5 mb-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
          <View className="p-3.5">
            <Text className="text-sm font-semibold text-gray-900 mb-3.5">
              Estatísticas de Aprendizado
            </Text>

            <View className="gap-2.5">
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Tempo total de estudo</Text>
                <Text className="text-xs font-medium text-gray-900">24h 30min</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Módulos completados</Text>
                <Text className="text-xs font-medium text-gray-900">12 de 18</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Quizzes realizados</Text>
                <Text className="text-xs font-medium text-gray-900">24</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Maior pontuação</Text>
                <Text className="text-xs font-medium text-gray-900">98%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Menu Card */}
        <View className="mx-3.5 mb-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
          <View className="px-3.5 py-1">
            <MenuItem icon={Settings} label="Configurações da Conta" />
            <MenuItem icon={Bell} label="Notificações" />
            <MenuItem icon={Award} label="Meus Certificados" />
            <MenuItem icon={HelpCircle} label="Ajuda e Suporte" />
            <MenuItem 
              icon={LogOut} 
              label="Sair" 
              danger 
              showArrow={false}
            />
          </View>
        </View>

        {/* Footer */}
        <View className="px-3.5 py-3.5 items-center gap-1">
          <Text className="text-[10.5px] text-gray-500">
            MedWaste Learning v1.0.0
          </Text>
          <Text className="text-[10.5px] text-gray-500">
            © 2024 Medical Education Platform
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}
