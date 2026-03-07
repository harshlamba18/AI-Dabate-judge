import { Manrope, Space_Grotesk } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata = {
  title: "AI Debate Judge",
  description: 'Real-time AI-assisted debate platform',
  icons: {
    icon: "../../public/AI.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable} font-[var(--font-body)] antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}