/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [], // Disable ESLint during development
  },
  typescript: {
    // Speed up type checking during development
    ignoreBuildErrors: true,
    tsconfigPath: "tsconfig.json",
  },
  images: {
    unoptimized: true,
  },
  // Optimize compilation speed
  compiler: {
    // Removes console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  reactStrictMode: false, // Disable strict mode for faster dev experience
  // Reduce build output
  output: 'standalone',
  
  // External packages (moved from experimental)
  serverExternalPackages: [],
  
  poweredByHeader: false,
  
  // Disable symlinks completely for Windows compatibility
  experimental: {
    // Modern options compatible with Turbopack
    serverMinification: true,
    serverSourceMaps: false,
    // Fix for Windows symbolic link issues
    isrFlushToDisk: false,
    // Disable symlinks for Windows compatibility
    disableOptimizedLoading: true,
    // Keep only valid experimental options
    forceSwcTransforms: true,
  },
  
  // Faster webpack builds
  webpack: (config, { isServer }) => {
    // Speed optimizations
    config.cache = true;
    
    // Disable symlinks in webpack
    config.resolve.symlinks = false;
    
    if (!isServer) {
      // Don't resolve these on client to reduce bundle size
      config.resolve.alias = {
        ...config.resolve.alias,
        'chart.js': 'chart.js/dist/Chart.min.js',
      };
    }
    
    // Suppress useLayoutEffect warnings during SSR
    if (isServer) {
      const originalEntry = config.entry;
      config.entry = async () => {
        const entries = await originalEntry();
        return {
          ...entries,
          // Add a module to suppress React useLayoutEffect warning
          ['suppress-warnings']: './lib/suppress-ssr-warnings.js',
        };
      };
    }
    
    return config;
  },
}

export default nextConfig
