import type { Metadata, Viewport } from "next";
import { Lexend, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import Sidebar from "@/components/navigation/Sidebar";
import { safeSupabase } from "@/lib/supabase/safe";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
  display: "swap",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "S6 Study Hub — UACE 2026 Revision",
  description:
    "Collaborative revision platform for Ugandan Senior 6 students preparing for UACE 2026: past papers, practice questions, discussions, and a personalised study plan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#14213D",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Deliberately never throws: this layout wraps EVERY route, including
  // error pages, so a Supabase misconfiguration or outage must degrade to
  // "render the site as if logged out" rather than crash the entire app.
  // Pages that actually require auth (e.g. /papers, /profile) do their own
  // guarded checks and show their own message if Supabase is unreachable.
  const { data: isAdmin } = await safeSupabase(async (supabase) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    return profile?.role === "admin";
  });

  return (
    <html lang="en" className={`${lexend.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <div className="flex min-h-dvh">
          <Sidebar isAdmin={isAdmin ?? false} />
          <div className="flex min-h-dvh flex-1 flex-col">
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <BottomNav />
          </div>
        </div>
      </body>
    </html>
  );
}
