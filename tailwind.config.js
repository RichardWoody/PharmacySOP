/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        nhs: {
          blue: '#005EB8',
          darkblue: '#003087',
          brightblue: '#0072CE',
          lightblue: '#41B6E6',
          aqua: '#00A9CE',
          green: '#007F3B',
          warmyellow: '#FFB81C',
          darkpink: '#7C2855',
          darkgrey: '#425563',
          midgrey: '#768692',
          paleblue: '#E8EDEE',
        }
      }
    },
  },
  plugins: [],
}
