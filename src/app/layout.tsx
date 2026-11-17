import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusBite — Smart College Canteen',
  description: 'Zero-install smart college canteen token system, staff POS, and public TV display',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased selection:bg-amber-500 selection:text-neutral-950">
        {children}
      </body>
    </html>
  );
}
