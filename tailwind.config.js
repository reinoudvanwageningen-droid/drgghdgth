/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html"],
  theme: {
    extend: {
      colors: {
        caps: {
          blue: "#0D3C60",
          light: "#1A4D74",
          orange: "#E97A08",
          gray: "#F3F4F6"
        }
      },
      fontFamily: {
        sans: ["Outfit", "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
        display: ["Anybody", "Outfit", "Inter", "system-ui", "sans-serif"]
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" }
        },
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(18px)" },
          "100%": { opacity: 1, transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        },
        glow: {
          "0%, 100%": { opacity: 0.55 },
          "50%": { opacity: 0.9 }
        }
      },
      animation: {
        floaty: "floaty 8s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite",
        fadeUp: "fadeUp 650ms ease-out both",
        fadeIn: "fadeIn 500ms ease-out both",
        glow: "glow 3.5s ease-in-out infinite"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(13,60,96,0.12)",
        soft2: "0 18px 50px rgba(13,60,96,0.18)"
      }
    }
  }
};
