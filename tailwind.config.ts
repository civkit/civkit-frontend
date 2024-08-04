// @ts-expect-error TS(1208): 'tailwind.config.ts' cannot be compiled under '--i... Remove this comment to see the full error message
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
