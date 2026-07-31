import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: "export",
      basePath: "/buy-compass-etf-cn",
      assetPrefix: "/buy-compass-etf-cn",
      images: { unoptimized: true },
      // The repository also contains Cloudflare-only helper files. The
      // interactive page itself is type-checked by the normal build and lint.
      typescript: { ignoreBuildErrors: true },
    }
  : {};

export default nextConfig;
