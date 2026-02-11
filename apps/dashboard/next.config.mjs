/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@workspace/ui", "@workspace/server", "@workspace/api-routes"],
};

export default nextConfig;
