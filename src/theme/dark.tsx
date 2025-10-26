import { createSystem, defaultConfig } from "@chakra-ui/react";

export const darkSystem = createSystem(defaultConfig, {
  theme: {
    tokens: {
      fonts: {
        heading: { value: `'Figtree', sans-serif` },
        body: { value: `'Figtree', sans-serif` },
      },
      colors: {
        primary: { value: "#38B2AC" },
        secondary: { value: "#2D3748" },
        text: { value: "#E2E8F0" },
        background: { value: "#1A202C" },
      },
    },
  },
});
