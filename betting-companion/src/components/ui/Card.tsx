"use client";

import { HTMLAttributes, forwardRef } from "react";

type CardVariant = "default" | "success" | "warning" | "danger" | "info" | "gold";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
  selected?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default: "card-noir",
  success: "card-emerald",
  warning: "card-amber",
  danger: "card-crimson",
  info: "card-noir border-[var(--gold-dim)]",
  gold: "card-gold",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      interactive = false,
      selected = false,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const interactiveStyles = interactive
      ? "cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-elevated active:scale-[0.98]"
      : "";
    const selectedStyles = selected
      ? "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-[var(--noir)]"
      : "";

    return (
      <div
        ref={ref}
        className={`
          ${variantStyles[variant]}
          ${interactiveStyles}
          ${selectedStyles}
          p-4
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export function CardHeader({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={`font-display text-xl font-semibold text-champagne ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={`text-sm text-secondary mt-1 ${className}`}>{children}</p>;
}

export function CardContent({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mt-4 pt-4 border-t border-[var(--noir-border)] ${className}`}>
      {children}
    </div>
  );
}
