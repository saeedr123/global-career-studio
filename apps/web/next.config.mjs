/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit loads font data files (for example Helvetica.afm) from its
  // own package folder at runtime. If Next.js bundles pdfkit into the
  // route file, that path breaks and PDF export fails with ENOENT.
  // Keeping pdfkit, docx, and the template engine external on the
  // server preserves their package folders and data files.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "docx"]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "pdfkit",
        "docx",
        "@global-career-studio/template-engine"
      ];
    }
    return config;
  }
};
export default nextConfig;
