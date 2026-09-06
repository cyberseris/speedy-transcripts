import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Mirrors the router's `scrollRestoration: true` behavior from the old
// TanStack Router setup: jump to the top of the page on every navigation.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
