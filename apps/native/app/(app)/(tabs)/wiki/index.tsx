import { View, ScrollView } from "react-native";
import { Container } from "@/components/container";
import { useState, useRef, useEffect } from "react";
import {
  WikiHeader,
  WikiFilterTabs,
  WikiSearchBar,
  WikiArticlesList,
  CategoryFilterBottomSheet,
  type Article,
} from "@/features/wiki/components";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import BottomSheet from "@gorhom/bottom-sheet";
import { useArticleStore } from "@/lib/stores/article-store";

type TabType = "todos" | "favoritos" | "lidos" | "categorias";

const articles: Article[] = [
  {
    id: "1",
    emoji: "💉",
    title: "Descarte de Perfurocortantes",
    description:
      "Guia completo sobre como descartar agulhas, seringas e outros materiais perfurocortantes de forma segura",
    level: "Básico",
    duration: "5 min",
  },
  {
    id: "2",
    emoji: "🧪",
    title: "Resíduos Químicos Hospitalares",
    description:
      "Aprenda a identificar e descartar corretamente resíduos químicos, reagentes e solventes usados em laboratórios",
    level: "Intermediário",
    duration: "8 min",
  },
  {
    id: "3",
    emoji: "🎨",
    title: "Sistema de Cores para Descarte",
    description:
      "Entenda o código de cores dos recipientes: vermelho, amarelo, branco, azul e suas aplicações específicas",
    level: "Básico",
    duration: "4 min",
  },
  {
    id: "4",
    emoji: "💊",
    title: "Medicamentos Oncológicos",
    description:
      "Protocolos específicos para descarte de medicamentos quimioterápicos e citotóxicos de alta periculosidade",
    level: "Avançado",
    duration: "10 min",
  },
  {
    id: "5",
    emoji: "🦠",
    title: "Resíduos Infectantes",
    description:
      "Como manusear e descartar materiais contaminados com agentes biológicos, sangue e fluidos corporais",
    level: "Intermediário",
    duration: "7 min",
  },
  {
    id: "6",
    emoji: "📋",
    title: "Gerenciamento de Resíduos",
    description:
      "Plano completo de gerenciamento desde a segregação até o descarte final, conforme RDC 222/2018",
    level: "Avançado",
    duration: "12 min",
  },
  {
    id: "7",
    emoji: "🧤",
    title: "EPIs para Descarte",
    description:
      "Equipamentos de proteção individual necessários para cada tipo de resíduo e situação de manuseio",
    level: "Básico",
    duration: "6 min",
  },
  {
    id: "8",
    emoji: "🚨",
    title: "Acidentes e Emergências",
    description:
      "Procedimentos de emergência para acidentes com materiais biológicos, químicos e perfurocortantes",
    level: "Intermediário",
    duration: "9 min",
  },
  {
    id: "9",
    emoji: "⚠️",
    title: "Protocolo de Perfuração Acidental",
    description:
      "Passo a passo para atendimento imediato em casos de perfuração com agulhas contaminadas",
    level: "Intermediário",
    duration: "5 min",
  },
  {
    id: "10",
    emoji: "🧬",
    title: "Descarte de Quimioterápicos",
    description:
      "Normas específicas para descarte seguro de medicamentos antineoplásicos e imunossupressores",
    level: "Avançado",
    duration: "11 min",
  },
  {
    id: "11",
    emoji: "⚗️",
    title: "Neutralização de Químicos",
    description:
      "Técnicas seguras para neutralizar ácidos, bases e outras substâncias químicas antes do descarte",
    level: "Avançado",
    duration: "9 min",
  },
  {
    id: "12",
    emoji: "🧹",
    title: "Limpeza de Derramamentos",
    description:
      "Procedimentos de contenção e limpeza de derramamentos de fluidos corporais e químicos",
    level: "Intermediário",
    duration: "7 min",
  },
];

export default function WikiScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { isRead, isFavorite, toggleFavorite } = useArticleStore();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const handleLevelToggle = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);

    if (newCategories.length > 0) {
      setActiveTab("categorias");
    }
  };

  const handleOpenCategories = () => {
    // If there are selected categories and we're already viewing them, open bottom sheet
    // Otherwise, always open bottom sheet to select categories
    if (activeTab === "categorias" && selectedCategories.length > 0) {
      bottomSheetRef.current?.expand();
    } else if (selectedCategories.length > 0) {
      // Just switch to categorias tab to view filtered results
      setActiveTab("categorias");
    } else {
      // No categories selected, open bottom sheet to select some
      bottomSheetRef.current?.expand();
    }
  };

  const handleFavoriteToggle = (articleId: string) => {
    toggleFavorite(articleId);
  };

  const filteredArticles = () => {
    if (activeTab === "favoritos") {
      return articles.filter((article) => isFavorite(article.id));
    }
    
    if (activeTab === "lidos") {
      return articles.filter((article) => isRead(article.id));
    }

    return articles;
  };

  useEffect(() => {
    if (selectedCategories.length === 0 && activeTab === "categorias") {
      setActiveTab("todos");
    }
  }, [selectedCategories, activeTab]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container className="flex-1 bg-gray-50">
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
        >
          <View className="px-6 pt-4 pb-2">
            <WikiHeader />

            <WikiFilterTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onCategoriesPress={handleOpenCategories}
              selectedCategoriesCount={selectedCategories.length}
            />

            <WikiSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <WikiArticlesList
            articles={filteredArticles()}
            onFavoriteToggle={handleFavoriteToggle}
          />
        </ScrollView>

        <CategoryFilterBottomSheet
          ref={bottomSheetRef}
          selectedLevels={selectedLevels}
          onLevelToggle={handleLevelToggle}
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
        />
      </Container>
    </GestureHandlerRootView>
  );
}
