import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Resets the scroll position to the top on every route change (except when the
 * browser restores a POP navigation, e.g. back/forward).
 */
const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    if (navigationType === "POP") return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, search, navigationType]);

  return null;
};

export default ScrollToTop;
