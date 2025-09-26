import * as React from "react";

import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "./button";

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<"input">
>(({ className, type: _type, ...props }, ref) => {
  const [isVisible, setIsVisible] = React.useState(false);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={isVisible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-0 top-0 h-full rounded-md rounded-l-none px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
        onClick={toggleVisibility}
        tabIndex={-1}
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        <span className="sr-only">
          {isVisible ? "Hide password" : "Show password"}
        </span>
      </Button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

export { Input, PasswordInput };
