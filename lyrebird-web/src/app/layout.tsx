import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope, Instrument_Serif } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  variable: "--font-instrument-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lyrebird",
  description: "AI Podcast Generation Studio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${manrope.variable} ${instrumentSerif.variable} antialiased font-manrope bg-[#Fdfcf8] text-stone-900 selection:bg-teal-200 selection:text-teal-900 relative w-full overflow-x-hidden`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
