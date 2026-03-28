import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title }) => {
  return (
    <div className="flex min-h-screen bg-hospital-slate">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-hospital-navy">{title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-hospital-teal rounded-full"></span>
              <p className="text-sm text-slate-500 font-medium">Ala de Internação - Unidade A</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Data Atual</p>
              <p className="text-sm font-semibold text-hospital-navy">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
        </header>

        <div className="animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
