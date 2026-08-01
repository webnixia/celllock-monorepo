'use client';

import { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  monthlyFee?: number;
  deviceLimit?: number;
  dueDate?: string;
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

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [monthlyFee, setMonthlyFee] = useState<number>(50000);
  const [deviceLimit, setDeviceLimit] = useState<number>(10);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

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
          adminEmail: `${adminUsername.toLowerCase().trim()}@controlcell.local`,
          adminPassword,
          monthlyFee: Number(monthlyFee),
          deviceLimit: Number(deviceLimit),
          dueDate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Error al registrar el local');
      }

      setSuccessMsg('¡Local y plan creados exitosamente!');
      setIsModalOpen(false);
      setName('');
      setSlug('');
      setAdminName('');
      setAdminUsername('');
      setAdminPassword('');
      setMonthlyFee(50000);
      setDeviceLimit(10);
      fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al guardar');
    }
  };

  // Suspender o reactivar local
  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    setError('');
    setSuccessMsg('');
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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'No se pudo actualizar el estado');
      }

      setSuccessMsg(`Local ${!currentStatus ? 'activado' : 'suspendido'} correctamente.`);
      fetchTenants();
      if (selectedTenant) {
        setSelectedTenant({ ...selectedTenant, isActive: !currentStatus });
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor');
    }
  };

  // Eliminar Local
  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!confirm(`¿Estás seguro de que querés eliminar el local "${tenantName}"? Se borrarán sus dispositivos y usuarios asociados permanentemente.`)) {
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/v1/tenants/${tenantId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'No se pudo eliminar el local');
      }

      setSuccessMsg('Local eliminado correctamente.');
      setSelectedTenant(null);
      fetchTenants();
    } catch (err: any) {
      setError(err.message || 'Error al intentar eliminar el local');
    }
  };

  return (
    <div className="p-8 space-y-8 bg-[#0b0f19] min-h-screen text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111827] p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            🚀 Súper Admin - Gestión de Locales & Suscripciones
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Controlá los límites de dispositivos, cobros mensuales, fechas de vencimiento y accesos de cada sucursal.
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
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError('')} className="text-xs hover:underline cursor-pointer">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>✨ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-xs hover:underline cursor-pointer">✕</button>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Cargando la red de locales...</div>
        ) : tenants.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
              🏢
            </div>
            <div className="max-w-sm mx-auto">
              <h3 className="text-base font-semibold text-white">No hay locales en la red</h3>
              <p className="text-xs text-gray-400 mt-1">Hacé clic en el botón de arriba para registrar tu primer cliente SaaS.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-400 bg-[#1f2937]/30">
                  <th className="p-4 font-semibold">Local / Tienda</th>
                  <th className="p-4 font-semibold">Límite Equipos</th>
                  <th className="p-4 font-semibold">Cuota Mensual</th>
                  <th className="p-4 font-semibold">Vencimiento</th>
                  <th className="p-4 font-semibold">Estado</th>
                  <th className="p-4 font-semibold text-right">Acciones de Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="p-4">
                      <p className="font-semibold text-white">{tenant.name}</p>
                      <p className="text-xs text-gray-400 font-mono">@{tenant.slug}</p>
                    </td>
                    <td className="p-4 text-gray-300">
                      <span className="font-semibold text-indigo-400">
                        {tenant._count?.devices || 0}
                      </span>{' '}
                      / {tenant.deviceLimit || 10} máx.
                    </td>
                    <td className="p-4 text-emerald-400 font-semibold">
                      ${tenant.monthlyFee ? tenant.monthlyFee.toLocaleString() : '50,000'} ARS
                    </td>
                    <td className="p-4 text-gray-300 text-xs font-mono">
                      {tenant.dueDate ? new Date(tenant.dueDate).toLocaleDateString() : 'Pendiente'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          tenant.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {tenant.isActive ? '🟢 Activo' : '🔴 Suspendido'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="text-indigo-400 hover:text-indigo-300 text-xs font-medium cursor-pointer"
                      >
                        Ver Detalles
                      </button>
                      <button
                        onClick={() => handleToggleStatus(tenant.id, tenant.isActive)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          tenant.isActive
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                      >
                        {tenant.isActive ? 'Suspender' : 'Reactivar'}
                      </button>
                      <button
                        onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                      >
                        Eliminar
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6 my-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Alta de Nuevo Local / Plan</h2>
                <p className="text-xs text-gray-400">Configura los límites comerciales y credenciales iniciales.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Nombre del Local</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Celulares Norte"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Slug (Identificador)</label>
                  <input
                    type="text"
                    required
                    placeholder="ej: cel-norte"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* SECCIÓN PLAN Y LÍMITES COMERCIALES */}
              <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wide">📦 Configuración del Plan & Cobro</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Límite Celulares</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={deviceLimit}
                      onChange={(e) => setDeviceLimit(Number(e.target.value))}
                      className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Cobro Mensual ($)</label>
                    <input
                      type="number"
                      required
                      step="1000"
                      value={monthlyFee}
                      onChange={(e) => setMonthlyFee(Number(e.target.value))}
                      className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-300 mb-1">Próximo Vencimiento</label>
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* DATOS DE ACCESO */}
              <div className="pt-2 border-t border-gray-800 space-y-3">
                <p className="text-xs font-semibold text-indigo-400">👤 Cuenta Administradora del Local</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Nombre y Apellido</label>
                  <input
                    type="text"
                    required
                    placeholder="Carlos Gómez"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-[#1f2937] border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Nombre de Usuario (Login)</label>
                    <input
                      type="text"
                      required
                      placeholder="carlos_norte"
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 rounded-xl text-xs font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 cursor-pointer">Cancelar</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 cursor-pointer">Crear Sucursal & Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER DETALLES PROFESIONALES */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="bg-[#111827] border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">{selectedTenant.name}</h2>
                <p className="text-xs text-indigo-400 font-mono">@{selectedTenant.slug}</p>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#1f2937]/50 p-3 rounded-2xl border border-gray-800">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Equipos Registrados</p>
                  <p className="text-base font-bold text-white mt-1">
                    {selectedTenant._count?.devices || 0} / <span className="text-indigo-400">{selectedTenant.deviceLimit || 10} máx</span>
                  </p>
                </div>
                <div className="bg-[#1f2937]/50 p-3 rounded-2xl border border-gray-800">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Cuota Mensual</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">
                    ${selectedTenant.monthlyFee ? selectedTenant.monthlyFee.toLocaleString() : '50,000'}
                  </p>
                </div>
              </div>

              <div className="bg-[#1f2937]/50 p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold">Próximo Vencimiento</p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {selectedTenant.dueDate ? new Date(selectedTenant.dueDate).toLocaleDateString() : 'Sin fecha fija'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold text-right">Estado</p>
                  <p className={`text-xs font-bold mt-0.5 text-right ${selectedTenant.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedTenant.isActive ? '🟢 Activo' : '🔴 Suspendido'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-800">
              <button
                onClick={() => handleToggleStatus(selectedTenant.id, selectedTenant.isActive)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  selectedTenant.isActive 
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' 
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                }`}
              >
                {selectedTenant.isActive ? 'Suspender Acceso' : 'Reactivar Cuenta'}
              </button>
              <button
                onClick={() => handleDeleteTenant(selectedTenant.id, selectedTenant.name)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 cursor-pointer"
              >
                Eliminar Local
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}