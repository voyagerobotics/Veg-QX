import "@/app/globals.css";
import SidebarAndMainWrapper from "@/components/layout/SidebarAndMainWrapper";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export const metadata = {
  title: "VEG QX — Voyage Robotics",
  description: "Advanced Spectral Quality & ML Pipeline System under Voyage Robotics",
  icons: {
    icon: "/voyage_robotics_logo.png",
    shortcut: "/voyage_robotics_logo.png",
    apple: "/voyage_robotics_logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/voyage_robotics_logo.png" type="image/png" />
      </head>
      <body className="bg-[var(--bg-primary)] text-[var(--text-primary)] flex min-h-screen antialiased transition-colors duration-200" suppressHydrationWarning>
        <ThemeProvider>
          <SidebarAndMainWrapper>{children}</SidebarAndMainWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
