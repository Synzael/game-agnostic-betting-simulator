"use client";

import { useEffect } from "react";
import { isAndroid } from "@/lib/platform";

export function AndroidSafeArea() {
  useEffect(() => {
    if (isAndroid) {
      document.body.classList.add("safe-top");
    }
    return () => {
      document.body.classList.remove("safe-top");
    };
  }, []);

  return null;
}
