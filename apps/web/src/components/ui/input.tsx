import * as React from "react";

import { cn } from "@/lib/utils";
import { EyeIcon, EyeOffIcon } from "lucide-react";

const baseInputClasses =
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const feedbackClasses =
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(baseInputClasses, feedbackClasses, className)}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  toggleLabels?: {
    show: string;
    hide: string;
  };
};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, toggleLabels, type = "password", ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);

    const labels = toggleLabels ?? {
      show: "Mostrar senha",
      hide: "Ocultar senha",
    };

    const inputType = isVisible ? "text" : type;

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={inputType}
          className={cn("pr-10", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          className="absolute inset-y-0 right-2 flex items-center justify-center rounded-md px-2 text-muted-foreground transition hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
          aria-label={isVisible ? labels.hide : labels.show}
          aria-pressed={isVisible}
        >
          <span className="sr-only">
            {isVisible ? labels.hide : labels.show}
          </span>
          {isVisible ? (
            <EyeOffIcon className="size-4" aria-hidden />
          ) : (
            <EyeIcon className="size-4" aria-hidden />
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export { Input, PasswordInput };
