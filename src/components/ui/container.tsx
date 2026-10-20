import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ContainerWidth = "wide" | "default" | "prose";

const WIDTH: Record<ContainerWidth, string> = {
  wide: "max-w-[96rem]",
  default: "max-w-[80rem]",
  prose: "max-w-[44rem]",
};

export function Container({
  as: Tag = "div",
  width = "default",
  className,
  children,
}: {
  as?: ElementType;
  width?: ContainerWidth;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn("mx-auto w-full px-5 sm:px-8 lg:px-12", WIDTH[width], className)}>{children}</Tag>
  );
}
