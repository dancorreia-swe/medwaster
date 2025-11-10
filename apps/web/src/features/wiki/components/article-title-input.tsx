interface ArticleTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ArticleTitleInput({
  value,
  onChange,
  placeholder = "Título do artigo",
}: ArticleTitleInputProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-4xl font-bold outline-none placeholder:text-muted-foreground/40 focus:placeholder:text-muted-foreground/60 transition-colors"
        placeholder={placeholder}
        autoFocus
      />
      {value.length > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">
          {value.length} caracteres
        </div>
      )}
    </div>
  );
}
