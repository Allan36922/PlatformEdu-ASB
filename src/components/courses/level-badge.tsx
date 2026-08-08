import { Badge } from "@/components/ui/badge";
import { courseLevelLabel } from "@/lib/utils";
import type { CourseLevel } from "@/types/database";

export function LevelBadge({ level, className }: { level: CourseLevel; className?: string }) {
  return (
    <Badge variant={level} className={className}>
      {courseLevelLabel(level)}
    </Badge>
  );
}
