/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/layouts/**/*.{js,ts,jsx,tsx}",
    // klasy komponentów logowania (LoginPage/LoginButton) z
    // biblioteki - bez tego Tailwind ich nie generował i przycisk był za wąski.
    "./node_modules/@galicea-lab/nextjs-keycloak-auth/dist/**/*.{js,mjs}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
