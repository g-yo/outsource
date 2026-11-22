"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function ScrollReveal() {
  const path = usePathname();
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    )
      return;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".section-heading,.service-card,.advantages>div,.operations-visual,.price-card",
      ),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "visible";
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.08 },
    );
    for (const el of elements) {
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.dataset.reveal = "pending";
        observer.observe(el);
      }
    }
    return () => {
      observer.disconnect();
      for (const el of elements) delete el.dataset.reveal;
    };
  }, [path]);
  return null;
}
