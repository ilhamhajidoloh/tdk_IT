import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TDK IT",
    short_name: "TDK IT",
    description: "ระบบจัดการโรงเรียน TDK IT",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0b10",
    theme_color: "#4f46e5",
    lang: "th",
    icons: [
      {
        src: "/tdk-it-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshots/desktop-home.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/mobile-home.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
  };
}
