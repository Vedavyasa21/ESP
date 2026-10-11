/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aeris: {
          bg: '#F5F2EB',            // Exact screenshot warm linen canvas
          card: '#FFFFFF',          // Pure card white
          border: '#EAE4D9',        // Ultra-subtle border
          borderLight: '#F0ECE4',
          sidebarActive: '#EDE9E1', // Active nav pill
          textPrimary: '#1A1D20',   // Deep charcoal
          textSecondary: '#757B82', // Neutral slate grey
          textMuted: '#9BA1A8',     // Muted labels
          
          // Screenshot Sage Green Theme (Normal State)
          green: {
            DEFAULT: '#4E8168',     // Forest sage green
            light: '#EDF4F0',       // Soft badge / pill background
            border: '#DCE7E1',
            dark: '#2E5E47',
            track: '#E8ECE9',
          },

          // Screenshot Crimson Red Theme (Alert State)
          red: {
            DEFAULT: '#C94A4A',     // Industrial crimson red
            light: '#FDF2F2',       // Soft alert tint
            border: '#FBDADA',
            dark: '#A63333',
            track: '#F5E6E6',
          },

          // Terracotta / Rose Wood Accent
          terracotta: {
            DEFAULT: '#A85968',
            light: '#F8EFEF',
            border: '#EEDCDC',
          }
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 2px 10px -2px rgba(26, 29, 32, 0.03), 0 1px 3px 0 rgba(26, 29, 32, 0.02)',
        'card-hover': '0 8px 24px -4px rgba(26, 29, 32, 0.06), 0 2px 6px -1px rgba(26, 29, 32, 0.03)',
      }
    },
  },
  plugins: [],
};
