/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/de",
        destination: "/de/admin/users",
        permanent: true,
      },
      {
        source: "/en",
        destination: "/en/admin/users",
        permanent: true,
      },
    ];
  },
  output: "standalone",
  transpilePackages: ["@workspace/ui", "@workspace/server", "@workspace/api-routes"],
};

export default nextConfig;
