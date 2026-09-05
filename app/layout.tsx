import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "FisioConsulta",
    template: "%s · FisioConsulta",
  },
  description:
    "Evaluación fisioterapéutica con diagnóstico diferencial, plan de tratamiento e informes PDF. PWA con modo offline para consultorio, clínica o domicilio.",
  applicationName: "FisioConsulta",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "FisioConsulta",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d5c56",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${outfit.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" />
          <PwaRegister />
        </AuthProvider>
      </body>
    </html>
  );
}
