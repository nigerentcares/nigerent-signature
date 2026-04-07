import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#1fa3a6',
          dark: '#157577',
          light: '#e2f4f4',
        },
        cream: '#e6ded5',
        gold: {
          DEFAULT: '#d4af37',
          light: '#f5eccb',
        },
        dark: {
          DEFAULT: '#1c1c1c',
          2: '#141f1f',
          3: '#0c1616',
        },
        bg: '#efebe6',
        muted: '#7b8594',
        green: {
          DEFAULT: '#1ea86a',
          light: '#e3f7ed',
        },
      },
      fontFamily: {
        sans: ['Urbanist', 'sans-serif'],
        serif: ['Cormorant Garamond', 'serif'],
      },
      maxWidth: {
        app: '430px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '22px',
        '4xl': '24px',
      },
    },
  },
  plugins: [],
}

export default config
