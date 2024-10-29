module.exports = {
  darkMode: 'class', // Ensure dark mode is enabled
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      textColor: {
        light: '#000', // Default text color for light mode
        dark: '#fff', // Text color for dark mode
      },
    },
  },
  plugins: [],
};
