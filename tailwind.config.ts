import { type Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "jesus": "url('/background.jpeg')",
      },
    },
  },
  plugins: [],
} satisfies Config;
