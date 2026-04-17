import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sub Debt Tracker 🥖',
  description: 'Post AI slop? You owe the squad a Crave Sub.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
