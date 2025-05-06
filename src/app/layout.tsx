import type {Metadata} from 'next';
import { Inter } from 'next/font/google'; // Import Inter font
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster

// Define Inter font with variable
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'StatCalc', // Mantener nombre de la app
  description: 'Calculadoras de Distribución Poisson e Hipergeométrica', // Updated description to Spanish
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es"> {/* Changed lang to es */}
      {/* Apply Inter font variable to body */}
      <body className={`${inter.variable} font-sans antialiased`}> {/* Use font-sans which references --font-inter */}
        {children}
        <Toaster /> {/* Add Toaster */}
      </body>
    </html>
  );
}
