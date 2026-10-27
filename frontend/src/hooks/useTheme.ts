import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const systemTheme = (): Theme =>
  window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(systemTheme);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return { theme, toggle: () => setTheme((t) => (t === "light" ? "dark" : "light")) };
}
