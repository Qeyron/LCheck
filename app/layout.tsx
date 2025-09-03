import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: [{ path: "./fonts/GeistVF.woff", style: "normal" }],
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
  fallback: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont", 
    "Segoe UI",
    "Roboto",
    "Oxygen",
    "Ubuntu",
    "Cantarell",
    "Fira Sans",
    "Droid Sans",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol"
  ],
  preload: true,
});

const geistMono = localFont({
  src: [{ path: "./fonts/GeistMonoVF.woff", style: "normal" }],
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  fallback: [
    "ui-monospace", 
    "SFMono-Regular", 
    "SF Mono", 
    "Monaco", 
    "Inconsolata", 
    "Fira Code", 
    "Fira Mono", 
    "Droid Sans Mono", 
    "Consolas", 
    "monospace"
  ],
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Linea Checker by Qeyron",
    template: "%s · Qeyron",
  },
  description: "Verification of addresses in the Linea network (eligibility, amounts, etc.)",
  metadataBase: new URL("https://qeyron.com"),
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/GeistVF.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/GeistMonoVF.woff"
          as="font"
          type="font/woff"
          crossOrigin="anonymous"
        />
        {/* Add font-display CSS for better fallback */}
        <style jsx global>{`
          @font-face {
            font-family: 'Geist Sans Fallback';
            src: local('Arial'), local('Helvetica'), local('sans-serif');
            font-display: block;
          }
        `}</style>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}