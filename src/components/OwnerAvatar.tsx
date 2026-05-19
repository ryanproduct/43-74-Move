import { cn } from "@/lib/utils";
import { avatarHex } from "@/lib/colors";

type Owner = {
  display_name: string;
  avatar_color: string;
} | null;

type Props = {
  owner: Owner;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  sm: "h-5 w-5 text-[10px]",
  md: "h-7 w-7 text-xs",
  lg: "h-10 w-10 text-sm",
};

/**
 * Coloured circle with the user's initial. Falls back to a muted "?" disc when
 * the task is unassigned. Used in lists, cards and detail headers.
 */
export function OwnerAvatar({ owner, size = "md", className }: Props) {
  if (!owner) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full bg-muted text-muted-foreground font-medium",
          SIZE_CLASSES[size],
          className
        )}
        aria-label="Unassigned"
        title="Unassigned"
      >
        ·
      </span>
    );
  }

  const initial = (owner.display_name?.[0] ?? "?").toUpperCase();
  const bg = avatarHex(owner.avatar_color);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium text-white",
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor: bg }}
      aria-label={owner.display_name}
      title={owner.display_name}
    >
      {initial}
    </span>
  );
}
