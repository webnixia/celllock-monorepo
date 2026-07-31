'use client';

import { Sidebar } from '@/components/Sidebar';

export default function UsersPage() {
  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-white">
      <Sidebar organizationName="ControlCell Corp" />

      <main className="flex-1 p-8 space-y-6">
        <div className="bg-[#111827] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold">Gestión de Usuarios / Operadores</h1>
          <p className="text-xs text-gray-400 mt-1">Administrá el personal con acceso al panel MDM</p>
        </div>

        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl text-center py-12">
          <p className="text-gray-400 text-sm">Próximamente: Lista de administradores y permisos de la empresa.</p>
        </div>
      </main>
    </div>
  );
}