import { TrueFalseSelector, MultipleChoiceEditor } from "./options";

interface QuestionOptionsEditorProps {
  options: Array<{ label: string; content: string; isCorrect: boolean }>;
  onChange: (
    options: Array<{ label: string; content: string; isCorrect: boolean }>,
  ) => void;
  isTrueFalse?: boolean;
}

const MAX_OPTIONS = 5;

export function QuestionOptionsEditor({
  options,
  onChange,
  isTrueFalse,
}: QuestionOptionsEditorProps) {
  if (isTrueFalse) {
    return <TrueFalseSelector options={options} onChange={onChange} />;
  }

  return (
    <MultipleChoiceEditor
      options={options}
      onChange={onChange}
      maxOptions={MAX_OPTIONS}
    />
  );
}
