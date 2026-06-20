/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // unpdf bundles pdf.js; keep it external on the server so Next doesn't try to
  // bundle its worker/wasm into the serverless function.
  serverExternalPackages: ["unpdf"],
}

export default nextConfig
