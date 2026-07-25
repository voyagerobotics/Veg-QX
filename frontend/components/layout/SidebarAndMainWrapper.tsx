"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function SidebarAndMainWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-screen w-full relative overflow-x-hidden">
      {/* Sidebar Container */}
      <div 
        className={`transition-all duration-300 ease-in-out z-50 flex shrink-0 ${
          isOpen ? "w-64 font-sans" : "w-0 overflow-hidden border-none"
        }`}
      >
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
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
