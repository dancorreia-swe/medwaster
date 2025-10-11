import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Flame,
  Target,
  Clock,
  BookOpen,
  Library,
  Award,
  ChevronRight,
} from "lucide-react-native";
import { Container } from "@/components/container";

export default function Dashboard() {
  return (
    <View className="flex-1 bg-[#FAFAFA]">
      <Container className="flex-1">
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center gap-2.5 px-5 py-4 bg-[#FAFAFA]">
            <View className="w-[35px] h-[35px] rounded-[12.75px] bg-blue-400 justify-center items-center">
              <Text className="text-white text-sm font-semibold">M</Text>
            </View>
            <Text className="text-lg font-semibold text-[#0A0A0A]">
              MedWaste
            </Text>
          </View>

          {/* Stats Card */}
          <View className="mx-5 mb-3.5 bg-white rounded-[12.75px] p-5 shadow-sm">
            <View className="flex-row justify-between mb-3.5">
              {/* Streak */}
              <View className="items-center gap-1">
                <View className="flex-row items-center gap-1">
                  <Flame size={18} color="#FF6900" strokeWidth={1.5} />
                  <Text className="text-[21px] font-semibold text-[#0A0A0A]">
                    7
                  </Text>
                </View>
                <Text className="text-[10.5px] text-[#6B7280] text-center">
                  dia
                </Text>
              </View>

              {/* Key Points */}
              <View className="items-center gap-0">
                <Text className="text-[21px] font-semibold text-[#155DFC]">
                  27
                </Text>
                <Text className="text-[10.5px] text-[#6B7280] text-center leading-7">
                  pontos-chave
                </Text>
              </View>

              {/* Minutes */}
              <View className="items-center gap-0">
                <Text className="text-[21px] font-semibold text-[#00A63E]">
                  44
                </Text>
                <Text className="text-[10.5px] text-[#6B7280] text-center">
                  minutos
                </Text>
              </View>

              {/* Modules */}
              <View className="items-center gap-0">
                <Text className="text-[21px] font-semibold text-[#9810FA]">
                  3
                </Text>
                <Text className="text-[10.5px] text-[#6B7280] text-center">
                  módulos
                </Text>
              </View>
            </View>

            {/* Daily Mission Button */}
            <TouchableOpacity className="bg-[#155DFC] rounded-[12.75px] py-3 flex-row items-center justify-center shadow-sm">
              <Text className="text-white text-[12.25px] font-medium tracking-tight">
                SUA MISSÃO DIÁRIA
              </Text>
              <ChevronRight size={14} color="#FFFFFF" className="ml-1" />
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <View className="mx-5 mb-3.5">
            <Text className="text-lg font-semibold text-[#0A0A0A] mb-3.5">
              Categorias de interesse
            </Text>
            <View className="grid grid-cols-2 gap-3.5">
              <CategoryCard
                title="Perfurocortantes"
                bgColor="#EFF6FF"
                iconColor="#155DFC"
              />
              <CategoryCard
                title="Químicos"
                bgColor="#FAF5FF"
                iconColor="#9810FA"
              />
              <CategoryCard
                title="Infectantes"
                bgColor="#FEF2F2"
                iconColor="#E7000B"
              />
              <CategoryCard
                title="Radioativos"
                bgColor="#FFFBEB"
                iconColor="#E17100"
              />
            </View>
          </View>

          {/* Recommended Trails */}
          <View className="mx-5 mb-3.5">
            <View className="mb-1">
              <Text className="text-lg font-semibold text-[#0A0A0A]">
                Para você começar
              </Text>
              <Text className="text-[12.25px] text-[#6B7280]">
                Trilhas recomendadas especialmente para você
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3.5 -mx-5 px-5 py-4"
            >
              <TrailCard
                title="Descarte de Perfurocortantes"
                category="Perfurocortantes"
                duration="15 min"
                gradient="from-[#2B7FFF] to-[#00B8DB]"
                categoryBg="rgba(255, 255, 255, 0.2)"
                status="new"
              />
              {/* <TrailCard */}
              {/*   title="Gestão de Resíduos Químicos" */}
              {/*   category="Químicos" */}
              {/*   duration="20 min" */}
              {/*   gradient="from-[#AD46FF] to-[#F6339A]" */}
              {/*   categoryBg="rgba(255, 255, 255, 0.2)" */}
              {/*   status="progress" */}
              {/*   progress={30} */}
              {/* /> */}
              {/* <TrailCard */}
              {/*   title="Segregação de Infectantes" */}
              {/*   category="Infectantes" */}
              {/*   duration="12 min" */}
              {/*   gradient="from-[#FB2C36] to-[#FF6900]" */}
              {/*   categoryBg="rgba(255, 255, 255, 0.2)" */}
              {/*   status="new" */}
              {/* /> */}
            </ScrollView>
          </View>

          {/* Quick Access */}
          <View className="mx-5 mb-6">
            <Text className="text-lg font-semibold text-[#0A0A0A] mb-3.5">
              Acesso rápido
            </Text>
            <View className="gap-2.5">
              <QuickAccessCard
                title="Biblioteca Wiki"
                description="Consulte protocolos e diretrizes"
                iconBgColor="#EFF6FF"
                iconColor="#155DFC"
                icon="library"
              />
              <QuickAccessCard
                title="Minhas Conquistas"
                description="Veja seu progresso e medalhas"
                iconBgColor="#F0FDF4"
                iconColor="#00A63E"
                icon="award"
              />
            </View>
          </View>
        </ScrollView>
      </Container>
    </View>
  );
}

// Category Card Component
function CategoryCard({
  title,
  bgColor,
  iconColor,
}: {
  title: string;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <TouchableOpacity className="bg-white rounded-lg p-3.5 shadow-sm shadow-black/15 w-full">
      <View className="flex-row items-center gap-2.5">
        <View
          className="size-8 rounded-[14px] justify-center items-center"
          style={{ backgroundColor: bgColor }}
        >
          <BookOpen size={16} color={iconColor} strokeWidth={1.75} />
        </View>
        <Text className="text-[12.25px] font-medium text-[#0A0A0A] flex-1">
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// Trail Card Component
function TrailCard({
  title,
  category,
  duration,
  gradient,
  categoryBg,
  status,
  progress,
}: {
  title: string;
  category: string;
  duration: string;
  gradient: string;
  categoryBg: string;
  status: "new" | "progress";
  progress?: number;
}) {
  return (
    <View className="bg-white rounded-[12.75px] mr-3.5 fle shadow-sm shadow-black/15">
      {/* Gradient Header */}
      <View className={`h-[140px] rounded-t-[12.75px] p-5 justify-between`}>
        {/* Decorative Blurs */}
        <View className="absolute top-3.5 right-3.5 w-[70px] h-[70px] rounded-full blur-[80px]" />
        <View className="absolute top-7 left-0 w-[112px] h-[112px] rounded-full blur-[128px]" />

        {/* Content */}
        <View>
          <View className="px-[7px] py-[3px] rounded-[6.75px] self-start mb-2">
            <Text className="text-[10.5px] font-medium text-white">
              {category}
            </Text>
          </View>
          <Text className="text-base font-semibold text-white leading-5">
            {title}
          </Text>
        </View>

        {/* Duration */}
        <View className="flex-row items-center gap-[7px]">
          <Clock size={14} color="rgba(255, 255, 255, 0.9)" strokeWidth={1.2} />
          <Text className="text-[12.25px] text-white/90">{duration}</Text>
        </View>
      </View>

      {/* Card Footer */}
      <View className="p-3.5">
        {status === "new" ? (
          <>
            <Text className="text-[12.25px] text-[#6B7280] mb-2.5">
              Protocolos de segurança essenciais
            </Text>
            <TouchableOpacity className="bg-white border border-black/10 rounded-[6.75px] py-1.5 items-center">
              <Text className="text-[12.25px] font-medium text-[#0A0A0A]">
                Começar
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text className="text-[12.25px] text-[#6B7280] mb-2.5">
              Procedimentos de emergência
            </Text>
            <View className="mb-[7px]">
              <View className="flex-row justify-between mb-[7px]">
                <Text className="text-[10.5px] text-[#6B7280]">Progresso</Text>
                <Text className="text-[10.5px] font-medium text-[#155DFC]">
                  {progress}%
                </Text>
              </View>
              <View className="h-[5.25px] bg-[#0066CC]/20 rounded-full overflow-hidden">
                <View
                  className="h-full bg-[#0066CC] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// Quick Access Card Component
function QuickAccessCard({
  title,
  description,
  iconBgColor,
  iconColor,
  icon,
}: {
  title: string;
  description: string;
  iconBgColor: string;
  iconColor: string;
  icon: "library" | "award";
}) {
  const IconComponent = icon === "library" ? Library : Award;

  return (
    <TouchableOpacity className="bg-white rounded-[12.75px] p-3.5 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View
            className="w-[35px] h-[35px] rounded-[12.75px] justify-center items-center"
            style={{ backgroundColor: iconBgColor }}
          >
            <IconComponent size={18} color={iconColor} strokeWidth={1.5} />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-[#0A0A0A] mb-0.5">
              {title}
            </Text>
            <Text className="text-[10.5px] text-[#6B7280]">{description}</Text>
          </View>
        </View>
        <ChevronRight size={18} color="#6B7280" strokeWidth={1.5} />
      </View>
    </TouchableOpacity>
  );
}
