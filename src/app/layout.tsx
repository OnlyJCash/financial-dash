import type { Metadata } from "next";
import { Inter } from "next/font/google";

import '@aws-amplify/ui-react/styles.css';
import "./globals.css";
import { Providers } from "@/components/Providers";
import { LayoutWrapper } from "@/components/LayoutWrapper";

import ConfigureAmplify from "@/lib/cognito-users";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FinDash - Financial Dashboard",
  description: "Track your financial movements effortlessly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ConfigureAmplify />
        <Providers>
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}

