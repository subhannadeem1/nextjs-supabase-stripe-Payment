"use client";

import { useEffect, useRef, useState } from "react";

import { cn, hueFrom, initials } from "@/lib/utils";

/** Website favicon with a coloured-initials fallback. */
export function CompanyLogo({
  name,
  domain,
  className,
}: {
  name: string;
  domain?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const hue = hueFrom(name);
  // The image may fail before hydration attaches onError — check once mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth <= 16) setFailed(true);
  }, [domain]);
  if (domain && !failed) {
    return (
      <span className={cn("grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border bg-white", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
          alt=""
          className="size-[62%] object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
          onLoad={(e) => {
            // Google returns a 16px globe when it has nothing — treat as missing.
            if ((e.currentTarget.naturalWidth || 0) <= 16) setFailed(true);
          }}
        />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg text-[11px] font-semibold text-white",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 58%), hsl(${(hue + 40) % 360} 75% 52%))`,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function PersonAvatar({ name, className }: { name: string; className?: string }) {
  const hue = hueFrom(name);
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
        className,
      )}
      style={{
        backgroundColor: `hsl(${hue} 80% 60% / 0.16)`,
        color: `hsl(${hue} 55% 45%)`,
      }}
    >
      {initials(name)}
    </span>
  );
}
