/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native OTel instrumentation is stable in Next 15+; enable the hook so
  // instrumentation.ts runs on Next 14 too.
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;
