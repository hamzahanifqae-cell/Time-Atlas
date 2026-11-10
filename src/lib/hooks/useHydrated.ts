import { useEffect, useState } from "react";

/** False during server rendering and the first client render, then true. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
