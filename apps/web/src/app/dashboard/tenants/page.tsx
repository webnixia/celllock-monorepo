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
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state (crear local)
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState(''); // 👈 Cambiado de correo a nombre de usuario
  const [adminPassword, setAdminPassword] = useState('');

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
      // Enviamos adminEmail usando el valor de adminUsername por compatibilidad con el backend
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
          adminEmail: `${adminUsername.toLowerCase().trim()}@controlcell.local`, // Creamos un correo interno automático basado en el usuario
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
      setAdminUsername('');
      setAdminPassword('');
      fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    }
  };

  // Función para suspender o reactivar local
  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/v1/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('No se pudo cambiar el estado del local');
      }

      setSuccessMsg(`Local ${!currentStatus ? 'activado' : 'suspendido'} correctamente.`);
      fetchTenants();
      if (selectedTenant) {
        setSelectedTenant({ ...selectedTenant, isActive: !currentStatus });
      }
    } catch (err: any) {
      setError(err.message || 'Error al actualizar estado');
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

      {/* ALERTAS */}
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

      {/* TABLA */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando locales...</div>
        ) : tenants.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              🏢
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="text-base font-semibold text-white">No hay locales registrados</h3>
              <p className="text-xs text-gray-400 mt-1">Hacé clic en el botón de arriba para registrar tu primera sucursal.</p>
            </div>
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
                        {tenant.isActive ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-medium cursor-pointer"
                      >
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => handleToggleStatus(tenant.id, tenant.isActive)}
                        className={`text-xs font-medium cursor-pointer ${
                          tenant.isActive ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'
                        }`}
                      >
                        {tenant.isActive ? 'Suspender' : 'Reactivar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: REGISTRAR NUEVO LOCAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-white">Registrar Nuevo Local</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Nombre del Local</label>
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
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Slug (Identificador único)</label>
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
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Nombre y Apellido</label>
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
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Nombre de Usuario (Login)</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: juan_centro"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Contraseña Temporal</label>
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 cursor-pointer">Guardar Local</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLES */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
              <h2 className="text-lg font-bold text-white">Detalles del Local</h2>
              <button onClick={() => setSelectedTenant(null)} className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-[#1f2937]/40 p-4 rounded-xl border border-gray-800 space-y-2">
                <p className="text-xs text-gray-400 uppercase font-semibold">Nombre de la Tienda</p>
                <p className="text-base font-bold text-white">{selectedTenant.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1f2937]/40 p-3 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Slug</p>
                  <p className="text-xs font-mono text-indigo-400 mt-1">{selectedTenant.slug}</p>
                </div>
                <div className="bg-[#1f2937]/40 p-3 rounded-xl border border-gray-800">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Estado</p>
                  <p className={`text-xs font-bold mt-1 ${selectedTenant.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedTenant.isActive ? 'Activo' : 'Suspendido'}
                  </p>
                </div>
              </div>

              <div className="bg-[#1f2937]/40 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Dispositivos Vinculados</p>
                  <p className="text-lg font-bold text-white mt-0.5">{selectedTenant._count?.devices || 0} equipos</p>
                </div>
                <div className="w-10 h-10 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  📱
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-800">
              <button
                onClick={() => handleToggleStatus(selectedTenant.id, selectedTenant.isActive)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  selectedTenant.isActive ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                {selectedTenant.isActive ? 'Suspender Local' : 'Reactivar Local'}
              </button>
              <button
                onClick={() => setSelectedTenant(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-800 text-white hover:bg-gray-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}