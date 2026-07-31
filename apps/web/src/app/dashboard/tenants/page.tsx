'use client';

import { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  users: { id: string; name: string; email: string; role: string }[];
  _count?: { devices: number };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Formulario para nuevo local
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_URL}/tenants`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setTenants(data);
      }
    } catch (err) {
      console.error('Error al cargar locales:', err);
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

    try {
      const res = await fetch(`${API_URL}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name, slug, adminName, adminEmail, adminPassword }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Error al crear el local');
      }

      // Limpiar formulario y recargar lista
      setName('');
      setSlug('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setShowModal(false);
      fetchTenants();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleTenantStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_URL}/tenants/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (res.ok) {
        setTenants(tenants.map(t => t.id === id ? { ...t, isActive: !currentStatus } : t));
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestión de Locales</h1>
            <p className="text-gray-400 text-sm mt-1">Administrá las tiendas clientes y sus accesos.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-blue-600/20"
          >
            + Nuevo Local
          </button>
        </div>

        {/* Tabla de Locales */}
        {loading ? (
          <div className="text-center py-20 text-gray-500">Cargando locales...</div>
        ) : (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider bg-gray-900/80">
                  <th className="py-4 px-6">Local / Tienda</th>
                  <th className="py-4 px-6">Slug</th>
                  <th className="py-4 px-6">Admin Encargado</th>
                  <th className="py-4 px-6 text-center">Celulares</th>
                  <th className="py-4 px-6 text-center">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-800/30 transition">
                    <td className="py-4 px-6 font-semibold text-white">{tenant.name}</td>
                    <td className="py-4 px-6 text-gray-400 font-mono text-xs">{tenant.slug}</td>
                    <td className="py-4 px-6">
                      {tenant.users?.[0] ? (
                        <div>
                          <p className="text-gray-200">{tenant.users[0].name}</p>
                          <p className="text-xs text-gray-500">{tenant.users[0].email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Sin admin</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center font-semibold text-blue-400">
                      {tenant._count?.devices || 0}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tenant.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {tenant.isActive ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => toggleTenantStatus(tenant.id, tenant.isActive)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                          tenant.isActive 
                            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                            : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                        }`}
                      >
                        {tenant.isActive ? 'Suspender' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal para Crear Local */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-xl font-bold mb-4">Registrar Nuevo Local</h2>
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Nombre del Local</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej: Local Centro Celulares"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Slug (Identificador único)</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="ej: centro-celulares"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="border-t border-gray-800 pt-4 mt-2">
                  <p className="text-xs font-semibold text-blue-400 mb-3">Datos del Administrador del Local</p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Nombre del Dueño/Admin</label>
                      <input
                        type="text"
                        required
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Juan Pérez"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="juan@centrocel.com"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Contraseña Temporal</label>
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-lg shadow-blue-600/20"
                  >
                    Guardar Local
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}