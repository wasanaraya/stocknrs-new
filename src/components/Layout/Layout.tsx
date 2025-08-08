import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export function Layout({ children, title }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gradient-hero relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-glow/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>
      
      <Sidebar />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-gradient-primary shadow-glow">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="w-full lg:pl-64 flex flex-col min-h-screen relative z-10">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-auto">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 relative">
            {/* Content Background */}
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-t-3xl border border-white/20 shadow-glow -z-10"></div>
            <div className="relative z-10 w-full">
              <div className="mx-auto max-w-7xl">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}