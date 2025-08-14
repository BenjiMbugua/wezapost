import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // OKLCH Color System - Light Theme
        background: 'oklch(0.9491 0.0085 197.0126)',
        foreground: 'oklch(0.3772 0.0619 212.6640)',
        primary: {
          DEFAULT: 'oklch(0.5624 0.0947 203.2755)',
          foreground: 'oklch(0.9724 0.0053 197.0692)',
        },
        card: {
          DEFAULT: 'oklch(0.9724 0.0053 197.0692)',
          foreground: 'oklch(0.3772 0.0619 212.6640)',
        },
        accent: {
          DEFAULT: 'oklch(0.9021 0.0297 201.8915)',
          foreground: 'oklch(0.3772 0.0619 212.6640)',
        },
        // Dark theme variables (CSS variables will handle the switch)
        'dark-background': 'oklch(0.2068 0.0247 224.4533)',
        'dark-foreground': 'oklch(0.8520 0.1269 195.0354)',
        'dark-primary': 'oklch(0.8520 0.1269 195.0354)',
        'dark-card': 'oklch(0.2293 0.0276 216.0674)',
        'dark-accent': 'oklch(0.3775 0.0564 216.5010)',
      },
      fontFamily: {
        sans: ['Source Code Pro', 'Courier New', 'monospace'],
        mono: ['Source Code Pro', 'Courier New', 'monospace'],
        serif: ['Source Code Pro', 'Courier New', 'monospace'],
      },
      borderRadius: {
        lg: '0.125rem',
        md: 'calc(0.125rem - 2px)',
        sm: 'calc(0.125rem - 4px)',
      },
      boxShadow: {
        'theme-xs': '0 1px 2px 0 rgba(142, 202, 230, 0.05)',
        'theme-sm': '0 1px 3px 0 rgba(142, 202, 230, 0.1), 0 1px 2px -1px rgba(142, 202, 230, 0.1)',
        'theme-md': '0 4px 6px -1px rgba(142, 202, 230, 0.1), 0 2px 4px -2px rgba(142, 202, 230, 0.1)',
        'theme-lg': '0 10px 15px -3px rgba(142, 202, 230, 0.1), 0 4px 6px -4px rgba(142, 202, 230, 0.1)',
      },
      animation: {
        'theme-transition': 'all 300ms ease-in-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config