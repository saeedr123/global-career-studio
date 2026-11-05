/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit loads font data files (for example Helvetica.afm) from its
  // own package folder at runtime. If Next.js bundles pdfkit into the
  // route file, that path breaks and PDF export fails with ENOENT.
  // Keeping pdfkit, docx, and the template engine external on the
  // server preserves their package folders and data files.
  // @prisma/client is external for the same reason in reverse: the
  // generated client lives in node_modules/.prisma/client and must be
  // required from node_modules at runtime, so Vercel file tracing can
  // follow the literal import in lib/prisma.ts and include it in the
  // function bundle. Bundling it would break on the generated files
  // and on the query engine binary.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit", "docx", "pdfjs-dist", "adm-zip", "@prisma/client"]
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "pdfkit",
        "docx",
        "pdfjs-dist",
        "adm-zip",
        "@global-career-studio/template-engine",
        "@prisma/client"
      ];
    }
    return config;
  }
};
export default nextConfig;
