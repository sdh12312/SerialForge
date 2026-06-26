import { X } from "lucide-react";

import { Badge } from "../../components/ui/badge";

export function WorkspaceTabs() {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
      <div className="flex items-center gap-2">
        <button className="flex h-8 items-center gap-2 rounded-lg border border-border bg-muted px-3 text-sm">
          默认会话
          <Badge>空闲</Badge>
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      <p className="text-xs text-muted-foreground">每个标签页将拥有独立收发记录、配置和统计</p>
    </div>
  );
}
