import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  title?: string;
  subtitle?: string;
  theme?: "light" | "dark";
  titleClassName?: string;
  subtitleClassName?: string;
}

const sizeMap = {
  xs: { width: 24, height: 28, class: "w-6 h-7" },
  sm: { width: 32, height: 38, class: "w-8 h-[38px]" },
  md: { width: 44, height: 52, class: "w-11 h-[52px]" },
  lg: { width: 64, height: 76, class: "w-16 h-[76px]" },
  xl: { width: 96, height: 114, class: "w-24 h-[114px]" },
};

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  className,
  showText = false,
  title = "PANITIA PILKADES",
  subtitle = "DESA KALISALAK",
  theme = "light",
  titleClassName,
  subtitleClassName,
}) => {
  const currentSize = sizeMap[size];
  const isDark = theme === "dark";

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div className={cn("relative shrink-0 drop-shadow-md transition-transform hover:scale-105", currentSize.class)}>
        <Image
          src="/logo.svg"
          alt="Logo Kabupaten Tegal"
          width={currentSize.width}
          height={currentSize.height}
          className="object-contain w-full h-full"
          priority
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={cn(
              "text-sm font-black tracking-tight uppercase leading-none",
              isDark ? "text-white" : "text-slate-900",
              titleClassName
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              "text-[11px] font-bold tracking-wider uppercase mt-0.5",
              isDark ? "text-blue-400" : "text-blue-700",
              subtitleClassName
            )}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};
