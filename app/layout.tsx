import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const image = `${protocol}://${host}/og.png`;
  return {
    title: "Proto Pirate — Learn Protocol Buffers Visually",
    description: "An interactive journey through schemas, wire formats, and safe protobuf evolution.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "Proto Pirate", description: "Learn Protobuf. Pack light. Sail fast.", type: "website", images: [image] },
    twitter: { card: "summary_large_image", title: "Proto Pirate", description: "A visual journey through Protocol Buffers.", images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
