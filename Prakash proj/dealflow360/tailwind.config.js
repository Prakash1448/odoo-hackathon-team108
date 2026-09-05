/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc', // slate-50
        surface: '#ffffff',
        primary: {
          DEFAULT: '#4f46e5', // indigo-600
          hover: '#4338ca', // indigo-700
          light: '#e0e7ff', // indigo-100
        },
        secondary: {
          DEFAULT: '#64748b', // slate-500
          hover: '#475569', // slate-600
        },
        border: '#e2e8f0', // slate-200
        danger: '#ef4444', // red-500
        success: '#10b981', // emerald-500
        warning: '#f59e0b', // amber-500
        info: '#3b82f6', // blue-500
      }
    },
  },
  plugins: [],
}
