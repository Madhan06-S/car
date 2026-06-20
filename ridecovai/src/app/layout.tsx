import type { Metadata } from "next";
import Link from 'next/link';
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { TransitionProvider } from "@/context/TransitionContext";
import CarTransitionLoader from "@/components/CarTransitionLoader";
import { AuthProvider } from "@/components/providers";
import HeaderAuth from "@/components/HeaderAuth";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  title: "RideCovai | Premium Car Rental in Coimbatore",
  description: "Experience luxury and comfort with RideCovai, the premier car rental service in Coimbatore. Self-drive or with a driver, we have the perfect vehicle for you.",
  keywords: ["car rental", "Coimbatore", "luxury car rental", "self-drive", "with driver", "RideCovai"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black">
      <body
        className={`${inter.variable} ${outfit.variable} antialiased bg-transparent text-foreground selection:bg-primary selection:text-primary-foreground min-h-screen flex flex-col relative`}
      >
        <AuthProvider>
          <TransitionProvider>
            <CarTransitionLoader />
            <video
              className="fixed inset-0 w-full h-full object-cover -z-50 opacity-45 pointer-events-none"
              src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260227_042027_c4b2f2ea-1c7c-4d6e-9e3d-81a78063703f.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-hidden
            />
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="font-heading font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-gray-500">
                  RideCovai
                </Link>
                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                  <Link href="/#fleet-section" className="transition-colors hover:text-primary">Fleet</Link>
                  <Link href="/#corporate" className="transition-colors hover:text-primary">Corporate</Link>
                  <Link href="/#about" className="transition-colors hover:text-primary">About Us</Link>
                  <Link href="/#contact" className="transition-colors hover:text-primary">Contact</Link>
                </nav>
                <HeaderAuth />
              </div>
            </header>

            <main className="flex-1">
              {children}
            </main>

            <footer className="border-t border-border mt-auto py-8 md:py-12">
              <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} RideCovai. All rights reserved.
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <Link href="/" className="hover:text-primary transition-colors">Privacy Policy</Link>
                  <Link href="/" className="hover:text-primary transition-colors">Terms of Service</Link>
                </div>
              </div>
            </footer>
          </TransitionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
