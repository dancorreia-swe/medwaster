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
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent text-4xl font-bold outline-none placeholder:opacity-40"
      placeholder={placeholder}
    />
  );
}
