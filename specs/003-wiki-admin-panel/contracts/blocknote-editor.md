# Contract: BlockNote Editor Integration

**Branch**: `003-wiki-admin-panel` | **Date**: 2025-01-26  
**Purpose**: Enhanced BlockNote editor integration for wiki article content

---

## Component Interface

### EditorProps
```typescript
interface WikiEditorProps {
  initialContent?: object;     // BlockNote JSON content
  onChange: (content: object) => void;
  onSave?: (content: object) => void;
  autoSave?: boolean;         // Default: true
  autoSaveInterval?: number;  // Default: 30000ms (30s)
  readOnly?: boolean;         // Default: false
  className?: string;
  placeholder?: string;
}
```

### Editor State Management
```typescript
interface EditorState {
  content: object;            // Current BlockNote JSON
  isDirty: boolean;          // Has unsaved changes
  isAutoSaving: boolean;     // Auto-save in progress
  lastSaved: Date | null;    // Last save timestamp
  wordCount: number;         // Current word count
  readingTime: number;       // Estimated reading time (minutes)
}
```

---

## Custom Blocks

### Medical Procedure Block
```typescript
interface ProcedureBlock {
  type: 'procedure';
  props: {
    title: string;
    steps: string[];
    safety_notes?: string[];
    equipment?: string[];
    warning_level?: 'low' | 'medium' | 'high';
  };
}
```

### Warning/Alert Block
```typescript
interface AlertBlock {
  type: 'alert';
  props: {
    variant: 'info' | 'warning' | 'danger' | 'success';
    title?: string;
    content: string;
    dismissible?: boolean;
  };
}
```

### Equipment List Block
```typescript
interface EquipmentBlock {
  type: 'equipment';
  props: {
    title: string;
    items: {
      name: string;
      description?: string;
      required: boolean;
      image_url?: string;
    }[];
  };
}
```

---

## Editor Configuration

### Slash Commands
```typescript
interface SlashCommands {
  '/procedimento': ProcedureBlock;
  '/alerta': AlertBlock;
  '/equipamentos': EquipmentBlock;
  '/tabela': TableBlock;
  '/imagem': ImageBlock;
  '/video': VideoBlock;
  '/citacao': QuoteBlock;
  '/codigo': CodeBlock;
  '/divisor': DividerBlock;
}
```

### Toolbar Configuration
```typescript
interface ToolbarConfig {
  // Text formatting
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  
  // Block types
  headings: ('h1' | 'h2' | 'h3' | 'h4')[];
  lists: ('bullet' | 'numbered' | 'check')[];
  
  // Media
  image: boolean;
  video: boolean;
  file: boolean;
  
  // Layout
  table: boolean;
  divider: boolean;
  quote: boolean;
  
  // Custom blocks
  procedure: boolean;
  alert: boolean;
  equipment: boolean;
}
```

---

## Image Upload Integration

### Upload Interface
```typescript
interface ImageUploadConfig {
  maxSize: number;           // Max file size in bytes
  allowedTypes: string[];    // ['image/jpeg', 'image/png', 'image/webp']
  uploadEndpoint: string;    // API endpoint for uploads
  generateThumbnails: boolean;
  altTextRequired: boolean;
}

interface UploadedImage {
  url: string;
  alt_text: string;
  width: number;
  height: number;
  file_size: number;
  thumbnail_url?: string;
}
```

### Upload Process
1. User selects image via editor
2. Client validates file size and type
3. Upload to `/api/admin/wiki/images` endpoint
4. Receive uploaded image metadata
5. Insert image block into editor content

---

## Content Processing

### Text Extraction
```typescript
interface ContentProcessor {
  extractPlainText(content: object): string;
  calculateWordCount(content: object): number;
  calculateReadingTime(content: object): number;
  generateExcerpt(content: object, maxLength?: number): string;
  extractImageUrls(content: object): string[];
  validateContent(content: object): ValidationResult;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  wordCount: number;
  estimatedReadingTime: number;
}
```

### Auto-Save Implementation
```typescript
interface AutoSaveConfig {
  enabled: boolean;
  interval: number;          // Milliseconds between saves
  minChanges: number;        // Minimum changes before triggering save
  endpoint: string;          // API endpoint for auto-save
  onSuccess?: (timestamp: Date) => void;
  onError?: (error: Error) => void;
}
```

---

## Event Handlers

### Editor Events
```typescript
interface EditorEvents {
  // Content changes
  onChange: (content: object, state: EditorState) => void;
  onAutoSave: (content: object, success: boolean) => void;
  
  // User interactions
  onFocus: () => void;
  onBlur: () => void;
  onImageUpload: (file: File) => Promise<UploadedImage>;
  
  // Content validation
  onValidation: (result: ValidationResult) => void;
  
  // Custom block events
  onProcedureCreate: (block: ProcedureBlock) => void;
  onAlertCreate: (block: AlertBlock) => void;
}
```

---

## Integration with Form

### Form Field Integration
```typescript
// React Hook Form integration
const ArticleForm = () => {
  const { control, watch, setValue } = useForm<ArticleFormData>();
  
  return (
    <Controller
      name="content"
      control={control}
      render={({ field }) => (
        <WikiEditor
          initialContent={field.value}
          onChange={field.onChange}
          autoSave={true}
          onSave={(content) => {
            // Optional manual save handler
            setValue('content', content);
          }}
        />
      )}
    />
  );
};
```

### Validation Integration
```typescript
interface ArticleFormData {
  title: string;
  content: object;           // BlockNote JSON
  category_id: number;
  tags: number[];
  meta_description?: string;
  featured_image_url?: string;
}

const validationSchema = yup.object({
  title: yup.string().min(5).max(200).required(),
  content: yup.object().test('min-content', 'Content too short', (value) => {
    const wordCount = ContentProcessor.calculateWordCount(value);
    return wordCount >= 25; // Minimum ~50 characters
  }),
  category_id: yup.number().required(),
  // ... other validations
});
```

---

## Accessibility Features

### Keyboard Navigation
- Tab through editor elements
- Slash commands accessible via keyboard
- Image alt text validation
- Heading hierarchy validation

### Screen Reader Support
- Proper ARIA labels for custom blocks
- Descriptive text for complex elements
- Alternative text for images required

---

## Performance Considerations

### Content Optimization
```typescript
interface PerformanceConfig {
  // Auto-save optimization
  debounceDelay: number;     // Delay before auto-save triggers
  maxContentSize: number;    // Maximum content size in bytes
  
  // Image optimization
  compressImages: boolean;
  maxImageWidth: number;
  generateWebP: boolean;
  
  // Content loading
  lazyLoadImages: boolean;
  preloadThumbnails: boolean;
}
```

### Memory Management
- Dispose editor instances properly
- Clean up auto-save intervals
- Optimize large content handling
- Image cleanup on content deletion

---

## Error Handling

### Common Errors
```typescript
interface EditorError {
  type: 'UPLOAD_FAILED' | 'SAVE_FAILED' | 'CONTENT_INVALID' | 'NETWORK_ERROR';
  message: string;
  retryable: boolean;
  details?: object;
}
```

### Error Recovery
- Auto-retry failed saves
- Local storage backup for content
- Graceful degradation for network issues
- User notification for critical errors