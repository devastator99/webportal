
import { useMediaQuery } from "./use-media-query";

export function useIsMobile() {
  return useMediaQuery("(max-width: 640px)");
}

export function useIsIPad() {
  return useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
}

export function useIsMobileOrIPad() {
  return useMediaQuery("(max-width: 1024px)");
}
