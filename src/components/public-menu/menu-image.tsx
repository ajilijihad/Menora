import type { CSSProperties } from "react";

type MenuImageProps = {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  width: number;
  height: number;
  priority?: boolean;
};

export function MenuImage({ src, alt, className, style, width, height, priority = false }: MenuImageProps) {
  return (
    // The storage host depends on the project, so next/image remote patterns are not fixed at build time.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
