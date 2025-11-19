import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { categoriesListQueryOptions } from "@/features/questions/api/categoriesAndTagsQueries";
import { Clock, Users, Target, Hash, Settings, FileText } from "lucide-react";
import { ImageUpload } from "@/features/questions/components/image-upload";

interface QuizFormData {
  title: string;
  description: string;
  instructions: string;
  difficulty: "basic" | "intermediate" | "advanced" | "mixed";
  status: "draft" | "active" | "inactive" | "archived";
  categoryId?: number;
  timeLimit?: number;
  maxAttempts: number;
  showResults: boolean;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  passingScore: number;
  imageUrl?: string;
  imageKey?: string;
}

interface QuizFormProps {
  formData: QuizFormData;
  onChange: (data: Partial<QuizFormData>) => void;
  questionCount: number;
}

const difficultyOptions = [
  { value: "basic", label: "Básico", color: "bg-green-100 text-green-800" },
  { value: "intermediate", label: "Intermediário", color: "bg-yellow-100 text-yellow-800" },
  { value: "advanced", label: "Avançado", color: "bg-red-100 text-red-800" },
  { value: "mixed", label: "Misto", color: "bg-purple-100 text-purple-800" },
];

const statusOptions = [
  { value: "draft", label: "Rascunho", color: "bg-gray-100 text-gray-800" },
  { value: "active", label: "Ativo", color: "bg-green-100 text-green-800" },
  { value: "inactive", label: "Inativo", color: "bg-yellow-100 text-yellow-800" },
  { value: "archived", label: "Arquivado", color: "bg-red-100 text-red-800" },
];

export function QuizForm({ formData, onChange, questionCount }: QuizFormProps) {
  const { data: categories = [] } = useQuery(categoriesListQueryOptions());

  const handleInputChange = (field: keyof QuizFormData, value: any) => {
    onChange({ [field]: value });
  };

  const selectedDifficulty = difficultyOptions.find(d => d.value === formData.difficulty);
  const selectedStatus = statusOptions.find(s => s.value === formData.status);

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Digite o título do quiz"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrição do quiz"
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="instructions">Instruções</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => handleInputChange("instructions", e.target.value)}
              placeholder="Instruções para os alunos"
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <ImageUpload
              label="Imagem do Quiz"
              value={formData.imageUrl}
              keyValue={formData.imageKey}
              uploadPath="/admin/quizzes/images/upload"
              deletePath="/admin/quizzes/images"
              onChange={(data) => {
                handleInputChange("imageUrl", data?.url || undefined);
                handleInputChange("imageKey", data?.key || undefined);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Classification */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Classificação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Dificuldade</Label>
            <Select
              value={formData.difficulty}
              onValueChange={(value: any) => handleInputChange("difficulty", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficultyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={option.color}>
                        {option.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => handleInputChange("status", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={option.color}>
                        {option.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Categoria</Label>
            <Select
              value={formData.categoryId?.toString() || "none"}
              onValueChange={(value) => handleInputChange("categoryId", value === "none" ? undefined : Number(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timeLimit" className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Tempo Limite
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="timeLimit"
                  type="number"
                  value={formData.timeLimit || ""}
                  onChange={(e) => handleInputChange("timeLimit", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                  min="0"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="maxAttempts" className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                Max. Tentativas
              </Label>
              <Input
                id="maxAttempts"
                type="number"
                value={formData.maxAttempts}
                onChange={(e) => handleInputChange("maxAttempts", Number(e.target.value))}
                min="1"
                className="mt-1"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="passingScore" className="flex items-center gap-2">
              <Target className="h-3 w-3" />
              Nota de Aprovação
            </Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="passingScore"
                type="number"
                value={formData.passingScore}
                onChange={(e) => handleInputChange("passingScore", Number(e.target.value))}
                min="0"
                max="100"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Behavior Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Comportamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showResults" className="text-sm font-medium">
                Mostrar Resultados
              </Label>
              <p className="text-xs text-muted-foreground">
                Exibe a pontuação final ao aluno
              </p>
            </div>
            <Switch
              id="showResults"
              checked={formData.showResults}
              onCheckedChange={(checked) => handleInputChange("showResults", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="showCorrectAnswers" className="text-sm font-medium">
                Mostrar Respostas Corretas
              </Label>
              <p className="text-xs text-muted-foreground">
                Mostra as respostas corretas após submissão
              </p>
            </div>
            <Switch
              id="showCorrectAnswers"
              checked={formData.showCorrectAnswers}
              onCheckedChange={(checked) => handleInputChange("showCorrectAnswers", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="randomizeQuestions" className="text-sm font-medium">
                Randomizar Perguntas
              </Label>
              <p className="text-xs text-muted-foreground">
                Altera a ordem das perguntas para cada tentativa
              </p>
            </div>
            <Switch
              id="randomizeQuestions"
              checked={formData.randomizeQuestions}
              onCheckedChange={(checked) => handleInputChange("randomizeQuestions", checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="randomizeOptions" className="text-sm font-medium">
                Randomizar Opções
              </Label>
              <p className="text-xs text-muted-foreground">
                Altera a ordem das opções de resposta
              </p>
            </div>
            <Switch
              id="randomizeOptions"
              checked={formData.randomizeOptions}
              onCheckedChange={(checked) => handleInputChange("randomizeOptions", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quiz Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Perguntas:</span>
              <span className="font-medium">{questionCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dificuldade:</span>
              <Badge variant="secondary" className={selectedDifficulty?.color}>
                {selectedDifficulty?.label}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="secondary" className={selectedStatus?.color}>
                {selectedStatus?.label}
              </Badge>
            </div>
            {formData.timeLimit && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tempo Limite:</span>
                <span className="font-medium">{formData.timeLimit} min</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
