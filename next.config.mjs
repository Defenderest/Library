/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputFileTracingIncludes: {
      "/*": ["./src/sql/**/*.sql"],
    },
  },
};

export default nextConfig;
