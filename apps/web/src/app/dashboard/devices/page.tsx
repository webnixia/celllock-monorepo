'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Device {
  id: string;
  model: string;
  imei: string | null;
  enrollmentCode: string;
  status: string;
  buyerName: string | null;
  buyerDni: string | null;
  buyerPhone: string | null;
  price: number | null;
  downPayment: number | null;
  installmentAmount: number | null;
  totalInstallments: number | null;
  paidInstallments: number;
  dueDate: string | null;
  tenant?: { name: string };
}

// URL dinámica para que funcione tanto en local como en producción en Vercel/Railway
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Estados del formulario de nueva venta
  const [formData, setFormData] = useState({
    model: '',
    imei: '',
    buyerName: '',
    buyerDni: '',
    buyerPhone: '',
    price: '',
    downPayment: '',
    totalInstallments: '12',
    dueDate: '',
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (e) {
      console.error('Error cargando dispositivos', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar la venta');

      setIsModalOpen(false);
      setFormData({
        model: '',
        imei: '',
        buyerName: '',
        buyerDni: '',
        buyerPhone: '',
        price: '',
        downPayment: '',
        totalInstallments: '12',
        dueDate: '',
      });
      fetchDevices();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/devices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchDevices();
    } catch (e) {
      console.error('Error actualizando estado', e);
    }
  };

  const deleteDevice = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/devices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchDevices();
    } catch (e) {
      console.error('Error al eliminar', e);
    }
  };

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.model.toLowerCase().includes(search.toLowerCase()) ||
      (d.buyerName && d.buyerName.toLowerCase().includes(search.toLowerCase())) ||
      (d.buyerDni && d.buyerDni.includes(search)) ||
      d.enrollmentCode.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-8 space-y-8 bg-[#0b0f19] min-h-screen text-gray-100">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827] border border-gray-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            📱 Gestión de Dispositivos y Financiación
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Control MDM en tiempo real, seguimiento de cuotas y bloqueo inteligente de equipos financiados.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>➕</span> Nueva Venta / Financiación
        </button>
      </div>

      {/* FILTROS Y BUSCADOR */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-96 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Buscar por modelo, cliente, DNI o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['ALL', 'ACTIVE', 'PENDING_ENROLLMENT', 'LOCKED', 'OVERDUE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#111827] border border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'Todos' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* LISTADO DE DISPOSITIVOS */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Cargando dispositivos con seguridad MDM...</div>
      ) : filteredDevices.length === 0 ? (
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-12 text-center space-y-3">
          <span className="text-4xl">📂</span>
          <p className="text-gray-300 font-medium">No se encontraron equipos registrados</p>
          <p className="text-xs text-gray-500">Registra una nueva venta con el botón superior para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDevices.map((device) => (
            <div
              key={device.id}
              className="bg-[#111827] border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-all shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            >
              {/* INFO PRINCIPAL */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white tracking-wide">{device.model}</h3>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                      device.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : device.status === 'LOCKED'
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {device.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  {device.buyerName && (
                    <span className="flex items-center gap-1 text-indigo-300 font-medium bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                      👤 {device.buyerName} {device.buyerDni ? `(DNI: ${device.buyerDni})` : ''}
                    </span>
                  )}
                  <span className="bg-gray-800/80 px-2.5 py-1 rounded-lg font-mono text-gray-300">
                    🔑 Enrolamiento: <strong className="text-white">{device.enrollmentCode}</strong>
                  </span>
                  <span className="bg-gray-800/80 px-2.5 py-1 rounded-lg font-mono text-gray-300">
                    📱 IMEI: {device.imei || 'Pendiente de vinculación'}
                  </span>
                </div>

                {/* DETALLE FINANCIERO */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-xs border-t border-gray-800/60 mt-3">
                  <div>
                    <span className="text-gray-500 block">Precio Total</span>
                    <span className="font-semibold text-white">${device.price?.toLocaleString() || '0'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Entrega Inicial</span>
                    <span className="font-semibold text-emerald-400">${device.downPayment?.toLocaleString() || '0'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Cuota Mensual</span>
                    <span className="font-semibold text-indigo-400">${device.installmentAmount?.toLocaleString() || '0'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Progreso de Cuotas</span>
                    <span className="font-semibold text-white">{device.paidInstallments} / {device.totalInstallments || 12} cuotas</span>
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN RÁPIDA */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-gray-800">
                {device.status === 'LOCKED' ? (
                  <button
                    onClick={() => updateStatus(device.id, 'ACTIVE')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                  >
                    🔓 Desbloquear
                  </button>
                ) : (
                  <button
                    onClick={() => updateStatus(device.id, 'LOCKED')}
                    className="bg-red-600/80 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-red-600/20 transition-all cursor-pointer"
                  >
                    🔒 Bloquear MDM
                  </button>
                )}
                <button
                  onClick={() => deleteDevice(device.id)}
                  className="bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  title="Eliminar registro"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL NUEVA VENTA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Registrar Nueva Venta / Financiación</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs">
                ⚠️ {formError}
              </div>
            )}

            <form onSubmit={handleCreateSale} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Modelo del Celular *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. iPhone 13 o Samsung S23"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full bg-[#1f2937] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">IMEI (Opcional)</label>
                  <input
                    type="text"
                    placeholder="15 dígitos"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    className="w-full bg-[#1f2937] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Cantidad de Cuotas</label>
                  <input
                    type="number"
                    value={formData.totalInstallments}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                    className="w-full bg-[#1f2937] border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-800">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Datos del Comprador</p>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre y Apellido"
                    value={formData.buyerName}
                    onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                    className="w-full bg-[#1f2937] border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="DNI / Cédula"
                    value={formData.buyerDni}
                    onChange={(e) => setFormData({ ...formData, buyerDni: e.target.value })}
                    className="w-full bg-[#1f2937] border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-800">
                <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Financiación y Pagos</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Precio Total ($)</label>
                    <input
                      type="text"
                      placeholder="500000"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-[#1f2937] border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Entrega Inicial ($)</label>
                    <input
                      type="text"
                      placeholder="100000"
                      value={formData.downPayment}
                      onChange={(e) => setFormData({ ...formData, downPayment: e.target.value })}
                      className="w-full bg-[#1f2937] border border-gray-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Registrar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}