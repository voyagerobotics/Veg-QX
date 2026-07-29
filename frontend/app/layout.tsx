import "@/app/globals.css";
import SidebarAndMainWrapper from "@/components/layout/SidebarAndMainWrapper";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/voyage_robotics_logo.png" type="image/png" />
      </head>
      <body className="bg-background text-slate-100 flex min-h-screen antialiased" suppressHydrationWarning>
        <SidebarAndMainWrapper>{children}</SidebarAndMainWrapper>
      </body>
    </html>
  );
}
