"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { BridgingDecision } from "@/engine/types";

interface DecisionCardProps {
  decision: BridgingDecision;
  title: string;
  description: string;
  icon: string;
  variant: "success" | "warning" | "danger";
  details?: React.ReactNode;
  onSelect: (decision: BridgingDecision) => void;
}

export function DecisionCard({
  decision,
  title,
  description,
  icon,
  variant,
  details,
  onSelect,
}: DecisionCardProps) {
  return (
    <Card
      variant={variant}
      interactive
      className="min-h-[200px]"
      onClick={() => onSelect(decision)}
    >
      <CardHeader>
        <div className="text-4xl mb-2">{icon}</div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {details && (
        <CardContent className="text-sm text-slate-300">
          {details}
        </CardContent>
      )}
    </Card>
  );
}
