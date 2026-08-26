"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function SidebarAndMainWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-screen w-full relative overflow-x-hidden bg-[var(--bg-primary)] transition-colors duration-200">
      {/* Sidebar Container — 100% Fixed & Viewport-Pinned */}
      <div 
        className={`transition-all duration-300 ease-in-out z-40 fixed top-0 left-0 h-screen ${
          isOpen ? "w-64 font-sans opacity-100" : "w-0 opacity-0 overflow-hidden pointer-events-none"
        }`}
      >
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>

      {/* Main Content Area — Dynamic Left Margin for Fixed Sidebar */}
      <div 
        className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        <TopBar isSidebarOpen={isOpen} onToggleSidebar={() => setIsOpen(!isOpen)} />
        <main className="flex-1 p-6 relative">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
