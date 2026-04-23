"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AppHotkeys() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.getElementById("global-search-input")?.focus();
        return;
      }

      if (event.altKey && event.key === "1") router.push("/dashboard");
      if (event.altKey && event.key === "2") router.push("/products");
      if (event.altKey && event.key === "3") router.push("/categories");
      if (event.altKey && event.key === "4") router.push("/members");
      if (event.altKey && event.key === "5") router.push("/audit");

      if (event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("invflow:open-product-dialog"));
      }

      if (event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("invflow:open-category-dialog"));
      }

      if (event.shiftKey && event.key.toLowerCase() === "i") {
        event.preventDefault();
        window.dispatchEvent(new CustomEvent("invflow:open-inventory-mode"));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

  return null;
}
