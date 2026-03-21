import type { Metadata } from "next";
import "./globals.css";
import AuthSessionDebug from "@/components/AuthSessionDebug";

export const metadata: Metadata = {
  title: "Testio | Automate Your Testimonials",
  description: "The simplest way for indie SaaS founders to collect and display testimonials.",
  icons: [
    { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthSessionDebug />
        {children}
      </body>
    </html>
  );
}
