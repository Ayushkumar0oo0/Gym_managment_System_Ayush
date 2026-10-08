/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          /*
           * Prevent the website from being embedded
           * inside an iframe on another website.
           */
          {
            key: "X-Frame-Options",
            value: "DENY",
          },

          /*
           * Prevent browsers from guessing MIME types.
           */
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          /*
           * Control how much referrer information
           * the browser sends to other websites.
           */
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          /*
           * Disable browser features that the website
           * doesn't need.
           */
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(self)",
          },

          /*
           * Force HTTPS when deployed.
           *
           * Browsers remember this policy for 1 year.
           * This is safe once your production domain is
           * permanently HTTPS.
           */
          {
            key: "Strict-Transport-Security",
            value:
              "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;