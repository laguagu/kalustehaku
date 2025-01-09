import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
import localFont from "next/font/local";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const robotoCondensed = Roboto_Condensed({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-condensed",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://tavaratrading-embeddings-alyakokeilut.2.rahtiapp.fi",
  ),
  title: "Tavaratrading - Tekoälyhaku",
  description: "Hae käytettyjä kalusteita teköälyn avulla",
  openGraph: {
    title: "Tavaratrading - Tekoälyhaku",
    description: "Tekoälyn avulla kalusteita",
    images: ["/android-chrome-512x512.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${robotoCondensed.variable} antialiased`}
      >
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
