import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, Upload } from "lucide-react-native";
import { toast } from "sonner-native";
import { authClient } from "@/lib/auth-client";
import { Icon } from "@/components/icon";

interface ProfilePictureUploaderProps {
  currentImage: string | null;
  onImageUpdate: (imageUrl: string) => void;
  size?: "sm" | "md" | "lg";
}

export function ProfilePictureUploader({
  currentImage,
  onImageUpdate,
  size = "lg",
}: ProfilePictureUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        toast.error("Permissão necessária", {
          description:
            "Conceda acesso à galeria para alterar sua foto de perfil",
        });
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      const maxSize = 5 * 1024 * 1024;
      if (asset.fileSize && asset.fileSize > maxSize) {
        toast.error("Imagem muito grande", {
          description: "Selecione uma imagem menor que 5MB",
        });
        return;
      }

      setIsUploading(true);

      const formData = new FormData();
      const fileName = asset.fileName || "avatar.jpg";
      const mimeType = asset.mimeType || "image/jpeg";

      formData.append("image", {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      } as any);

      const cookies = authClient.getCookie();

      const apiUrl = process.env.EXPO_PUBLIC_SERVER_URL || process.env.EXPO_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL não configurada (EXPO_PUBLIC_SERVER_URL ou EXPO_PUBLIC_API_URL)");
      }

      const response = await fetch(`${apiUrl}/api/profile/avatar/upload`, {
        method: "POST",
        body: formData,
        headers: {
          ...(cookies ? { Cookie: cookies } : {}),
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Falha no upload (${response.status})`);
      }

      const data = await response.json();

      if (data.success && data.data.url) {
        onImageUpdate(data.data.url);
        toast.success("Foto de perfil atualizada!");
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Não foi possível fazer o upload", {
        description: "Tente novamente com outra imagem.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="items-center gap-3">
      <TouchableOpacity
        onPress={pickImage}
        disabled={isUploading}
        activeOpacity={0.85}
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800`}
      >
        {currentImage ? (
          <Image
            source={{ uri: currentImage }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Camera size={iconSizes[size] + 8} className="text-gray-400/70" />
            <Text className="mt-1 text-base font-medium text-gray-500 dark:text-gray-400">
              Adicionar foto
            </Text>
          </View>
        )}

        {isUploading && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={pickImage}
        disabled={isUploading}
        className="flex-row items-center gap-2 px-4 py-2 bg-blue-500/90 dark:bg-blue-600 rounded-full active:opacity-80 shadow-sm"
        activeOpacity={0.85}
      >
        <Icon icon={Upload} size={16} className="text-white" />
        <Text className="text-white font-semibold text-base">
          {currentImage ? "Trocar foto" : "Enviar foto"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
