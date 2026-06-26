import type { HTMLAttributes } from "react";

import { cn } from "../../utils/cn";

export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-panel text-panel-foreground shadow-panel",
        className,
      )}
      {...props}
    />
  );
}
