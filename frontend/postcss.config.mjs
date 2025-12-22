/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Reduce autoprefixer processing
      flexbox: 'no-2009',
      // Use overrideBrowserslist instead of browsers
      overrideBrowserslist: ['> 1%', 'last 2 versions'],
    },
  }
};

export default config;
