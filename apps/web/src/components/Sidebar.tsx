'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  organizationName?: string;
}

export function Sidebar({ organizationName = 'ControlCell Corp' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Leemos el rol y lo pasamos a mayúsculas para evitar problemas de formato
    const role = (localStorage.getItem('role') || '').toUpperCase();
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  // Verificamos si es administrador o superadmin para mostrar los locales
  const isAdminOrSuper = userRole.includes('ADMIN') || userRole === 'SUPERADMIN';

  // Definimos las opciones del menú de forma dinámica
  const navItems = [
    { label: 'Dashboard', href: '/', icon: '📊', show: true },
    { label: 'Dispositivos', href: '/dashboard/devices', icon: '📱', show: true },
    { label: 'Locales', href: '/dashboard/tenants', icon: '🏢', show: isAdminOrSuper },
    { label: 'Usuarios / Personal', href: '/users', icon: '👥', show: true },
    { label: 'Configuración', href: '/settings', icon: '⚙️', show: true },
  ];

  return (
    <aside className="w-64 bg-[#111827] border-r border-gray-800 min-h-screen flex flex-col justify-between p-4 sticky top-0 h-screen shrink-0">
      <div className="space-y-6">
        {/* LOGO & BRAND */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xl">
            📱
          </div>
          <div>
            <h1 className="font-bold text-white tracking-tight text-base leading-tight">ControlCell</h1>
            <p className="text-[11px] text-indigo-400 font-medium">
              {userRole.includes('SUPERADMIN') ? 'Super Admin' : 'MDM Admin'}
            </p>
          </div>
        </div>

        {/* ORGANIZACIÓN BADGE */}
        <div className="px-3 py-2.5 bg-[#1f2937]/50 border border-gray-800 rounded-xl">
          <p className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">Organización</p>
          <p className="text-xs font-semibold text-white mt-0.5 truncate">{organizationName}</p>
        </div>

        {/* NAV MENU */}
        <nav className="space-y-1">
          {navItems
            .filter((item) => item.show) // Filtramos solo los elementos permitidos para este rol
            .map((item, idx) => {
              const isActive = pathname === item.href && (item.label === 'Dashboard' || pathname !== '/');
              return (
                <Link
                  key={`${item.href}-${idx}`}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </div>

      {/* FOOTER - LOGOUT */}
      <div className="pt-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all cursor-pointer"
        >
          <span className="text-base">🚪</span>
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}