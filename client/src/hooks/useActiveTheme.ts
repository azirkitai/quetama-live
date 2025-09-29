import { useQuery } from "@tanstack/react-query";
import { type Theme } from "@shared/schema";

export function useActiveTheme() {
  return useQuery<Theme>({
    queryKey: ['/api/themes/active'],
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
}

// Utility function to create gradient styles
export function createGradientStyle(gradientString: string | null | undefined, fallbackColor: string) {
  if (!gradientString || gradientString.trim() === '') {
    return { backgroundColor: fallbackColor };
  }
  
  return { 
    backgroundImage: gradientString,
    backgroundColor: 'transparent' // Ensure background color doesn't override gradient
  };
}

// Utility function to create text gradient styles
export function createTextGradientStyle(gradientString: string | null | undefined, fallbackColor: string) {
  if (!gradientString || gradientString.trim() === '') {
    return { color: fallbackColor };
  }
  
  return { 
    background: gradientString,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent' // Fallback for non-webkit browsers
  };
}