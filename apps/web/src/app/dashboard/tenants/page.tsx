'use client';

import { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    devices: number;
    users: number;
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // URL del backend apuntando correctamente al prefijo /api/v1
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://celllock-monorepo-production.up.railway.app';

  const fetchTenants = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/v1/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (err) {
      console.error('Error cargando locales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/v1/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          slug,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar el local');
      }

      setSuccessMsg('¡Local creado exitosamente!');
      setIsModalOpen(false);
      setName('');
      setSlug('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0b0f19] min-h-screen text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            🏢 Gestión de Locales y Tiendas
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Administrá los negocios clientes, sus accesos y el estado de sus suscripciones MDM.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 text-sm cursor-pointer"
        >
          <span>+</span> Registrar Nuevo Local
        </button>
      </div>

      {/* ERROR / SUCCESS ALERTS */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">
          {successMsg}
        </div>
      )}

      {/* CONTENT / TABLE */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando locales...</div>
        ) : tenants.length === 0 ? (
          /* ESTADO VACÍO ELEGANTE */
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              🏢
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="text-base font-semibold text-white">No hay locales registrados</h3>
              <p className="text-xs text-gray-400 mt-1">
                Todavía no diste de alta ningún local o sucursal. Hacé clic en el botón de arriba para crear el primero.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all border border-gray-700 cursor-pointer"
            >
              Crear mi primer local
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-400 bg-[#1f2937]/30">
                  <th className="p-4 font-semibold">Local / Tienda</th>
                  <th className="p-4 font-semibold">Slug</th>
                  <th className="p-4 font-semibold">Dispositivos</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4 font-medium text-white">{tenant.name}</td>
                    <td className="p-4 text-gray-400 font-mono text-xs">{tenant.slug}</td>
                    <td className="p-4 text-gray-300">{tenant._count?.devices || 0} equipos</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tenant.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {tenant.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-indigo-400 hover:text-indigo-300 text-xs font-medium cursor-pointer">
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CREACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-white">Registrar Nuevo Local</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Nombre del Local
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: ControlCell Centro"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Slug (Identificador único sin espacios)
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: controlcell-centro"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs font-semibold text-indigo-400 mb-3">Datos del Administrador del Local</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                      Nombre del Administrador
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Juan Pérez"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@local.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                      Contraseña Temporal
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 cursor-pointer transition-all"
                >
                  Guardar Local
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}