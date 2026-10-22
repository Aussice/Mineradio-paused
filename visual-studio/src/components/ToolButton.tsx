import type { ButtonHTMLAttributes, ReactNode } from "react";

type ToolButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
};

export function ToolButton({
  label,
  children,
  className = "",
  ...props
}: ToolButtonProps) {
  return (
    <button
      type="button"
      className={`tool-button ${className}`}
      aria-label={label}
      data-tooltip={label}
      {...props}
    >
      {children}
    </button>
  );
}
