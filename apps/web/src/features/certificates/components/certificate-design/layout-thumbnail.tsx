import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type ThumbnailPalette = {
  ink: string;
  accent: string;
  tint: string;
  detail?: string;
};

function Line({
  className,
  color,
  style,
}: {
  className: string;
  color: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={cn("block rounded-full", className)}
      style={{ backgroundColor: color, ...style }}
    />
  );
}

function QrMark({ color, className }: { color: string; className: string }) {
  return (
    <span
      className={cn("absolute block aspect-square rounded-[1px]", className)}
      style={{ backgroundColor: color, opacity: 0.85 }}
    />
  );
}

/**
 * Schematic sketch of a Layout in the selected Palette. Only the preview
 * panel shows the real PDF.
 */
export function LayoutThumbnail({
  layoutId,
  palette,
}: {
  layoutId: string;
  palette: ThumbnailPalette;
}) {
  const { ink, accent, tint } = palette;
  const muted = { opacity: 0.35 };

  if (layoutId === "classico") {
    return (
      <span
        aria-hidden
        className="relative block aspect-[297/210] w-full overflow-hidden rounded-[3px]"
        style={{ backgroundColor: tint }}
      >
        <span
          className="absolute inset-[5%] border"
          style={{ borderColor: accent }}
        />
        <span
          className="absolute inset-[8%] border-[0.5px]"
          style={{ borderColor: accent, opacity: 0.6 }}
        />
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <Line className="h-[3px] w-[38%]" color={ink} />
          <Line className="mt-0.5 h-[5px] w-[50%]" color={ink} />
          <span
            className="block h-px w-[34%]"
            style={{ backgroundColor: accent }}
          />
          <Line className="h-[2px] w-[40%]" color={ink} style={muted} />
          <span className="mt-1.5 flex w-[56%] justify-between">
            <Line className="h-px w-[38%]" color={ink} style={{ opacity: 0.5 }} />
            <Line className="h-px w-[38%]" color={ink} style={{ opacity: 0.5 }} />
          </span>
        </span>
        <QrMark color={ink} className="right-[12%] bottom-[13%] w-[8%]" />
      </span>
    );
  }

  if (layoutId === "minimalista") {
    return (
      <span
        aria-hidden
        className="relative flex aspect-[297/210] w-full overflow-hidden rounded-[3px] bg-white"
      >
        <span className="w-[4%] shrink-0" style={{ backgroundColor: accent }} />
        <span className="flex flex-1 flex-col justify-center gap-1 pr-[8%] pl-[10%]">
          <Line className="h-[2px] w-[28%]" color={ink} style={{ opacity: 0.45 }} />
          <Line className="h-[7px] w-[68%]" color={ink} />
          <Line className="h-[2px] w-[46%]" color={ink} style={muted} />
          <span className="mt-1.5 flex gap-[10%]">
            <Line className="h-[3px] w-[14%]" color={ink} />
            <Line className="h-[3px] w-[14%]" color={ink} />
            <Line className="h-[3px] w-[14%]" color={ink} />
          </span>
        </span>
        <QrMark color={ink} className="right-[8%] bottom-[11%] w-[9%]" />
      </span>
    );
  }

  // Moderno (and the fallback for any future Layout id).
  const detail = palette.detail ?? accent;
  return (
    <span
      aria-hidden
      className="block aspect-[297/210] w-full overflow-hidden rounded-[3px] p-[6%]"
      style={{ backgroundColor: tint }}
    >
      <span className="relative flex h-full flex-col overflow-hidden rounded-[2px] bg-white">
        <span className="flex h-[3px] shrink-0">
          <span className="flex-1" style={{ backgroundColor: accent }} />
          {palette.detail && (
            <span className="w-[18%]" style={{ backgroundColor: detail }} />
          )}
        </span>
        <span className="flex flex-1 flex-col justify-center gap-1.5 px-[9%]">
          <Line className="h-[3px] w-[40%]" color={ink} />
          <span className="flex items-center gap-[6%]">
            <span
              className="block aspect-square w-[16%] shrink-0 rounded-full border-[1.5px]"
              style={{ borderColor: detail, backgroundColor: tint }}
            />
            <span className="flex flex-1 flex-col gap-1">
              <Line className="h-[5px] w-[72%]" color={ink} />
              <Line className="h-[2px] w-[56%]" color={ink} style={muted} />
            </span>
          </span>
          <span className="flex gap-[10%]">
            <Line className="h-[3px] w-[16%]" color={ink} />
            <Line className="h-[3px] w-[16%]" color={ink} />
            <Line className="h-[3px] w-[16%]" color={ink} />
          </span>
        </span>
        <span className="block h-[22%]" />
        <span className="absolute bottom-[12%] left-[9%]">
          <Line className="h-[2px] w-6" color={ink} style={{ opacity: 0.5 }} />
        </span>
        <QrMark color={ink} className="right-[8%] bottom-[9%] w-[11%]" />
      </span>
    </span>
  );
}
