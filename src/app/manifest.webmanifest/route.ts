import { NextResponse } from "next/server";

/** PWA manifest — installable web app now; native shells (Expo) added later. */
export function GET() {
  return NextResponse.json({
    name: "Versona",
    short_name: "Versona",
    description: "Where the whole person meets the whole community.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7c3aed",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  });
}
