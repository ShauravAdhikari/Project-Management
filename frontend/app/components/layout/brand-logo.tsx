import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  textClassName?: string;
  showText?: boolean;
  compact?: boolean;
}

export const BrandLogo = ({
  className,
  imageClassName,
  textClassName,
  showText = true,
  compact = false,
}: BrandLogoProps) => {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-black shadow-sm">
        <img
          src="/yutani-foundation-logo.png"
          alt="Yutani Foundation logo"
          className={cn(
            compact ? "size-10 object-cover" : "size-14 object-cover",
            imageClassName
          )}
        />
      </div>

      {showText && (
        <div className={cn("min-w-0", textClassName)}>
          <p className="text-sm font-semibold leading-tight">Yutani Foundation</p>
          <p className="text-xs text-muted-foreground">Project management</p>
        </div>
      )}
    </div>
  );
};
