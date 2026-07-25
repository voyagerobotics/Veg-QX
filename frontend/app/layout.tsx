import "@/app/globals.css";
import SidebarAndMainWrapper from "@/components/layout/SidebarAndMainWrapper";

export const metadata = {
  title: "Tomato Freshness Detection System",
  description: "Scientific dashboard and ML pipeline portal for tomato quality estimation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-slate-100 flex min-h-screen antialiased">
        <SidebarAndMainWrapper>{children}</SidebarAndMainWrapper>
      </body>
    </html>
  );
}
