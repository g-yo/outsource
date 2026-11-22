"use client";
import { useState } from "react";
import { Cloud } from "lucide-react";
export function AssetImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span
      className={`image-fallback ${className || ""}`}
      role="img"
      aria-label={alt}
    >
      <Cloud strokeWidth={1} />
    </span>
  ) : (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
