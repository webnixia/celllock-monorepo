'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';

interface Device {
  id: string;
  imei?: string;
  model: string;
  status?: string;
  enrollmentCode?: string;
  buyerName?: string;
  buyerDni?: string;
  buyerPhone?: string;
  price?: number;
  downPayment?: number;
  installmentAmount?: number;
  totalInstallments?: number;
  paidInstallments?: number;
  paymentFrequency?: string;
  dueDate?: string;
  createdAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function DevicesFleetPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [price, setPrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [paymentFrequency, setPaymentFrequency] = useState('MENSUAL');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const calculateDefaultDueDate = (frequency: string) => {
    const now = new Date();
    if (frequency === 'SEMANAL') now.setDate(now.getDate() + 7);
    else if (frequency === 'QUINCENAL') now.setDate(now.getDate() + 15);
    else now.setMonth(now.getMonth() + 1);
    return now.toISOString().split('T')[0];
  };

  const handleFrequencyChange = (newFreq: string) => {
    setPaymentFrequency(newFreq);
    setDueDate(calculateDefaultDueDate(newFreq));
  };

  const parsedPrice = parseFloat(price) || 0;
  const parsedDownPayment = parseFloat(downPayment) || 0;
  const parsedTotalInstallments = parseInt(totalInstallments) || 0;
  const balanceToFinance = Math.max(0, parsedPrice - parsedDownPayment);
  const calculatedInstallment = parsedTotalInstallments > 0 ? balanceToFinance / parsedTotalInstallments : 0;

  const loadDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al obtener la flota de dispositivos');
      const data = await response.json();
      if (Array.isArray(data)) setDevices(data);
    } catch (err) {
      console.error('Error cargando flota:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadDevices();
  }, [router]);

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: model.trim(),
          imei: imei.trim() || null,
          buyerName: buyerName.trim() || null,
          buyerDni: buyerDni.trim() || null,
          buyerPhone: buyerPhone.trim() || null,
          price: price ? parseFloat(price) : null,
          downPayment: downPayment ? parseFloat(downPayment) : null,
          installmentAmount: calculatedInstallment > 0 ? calculatedInstallment : null,
          totalInstallments: totalInstallments ? parseInt(totalInstallments) : null,
          paymentFrequency,
          dueDate: dueDate || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.message || 'Error al registrar el dispositivo');
      }

      setModel('');
      setImei('');
      setBuyerName('');
      setBuyerDni('');
      setBuyerPhone('');
      setPrice('');
      setDownPayment('');
      setTotalInstallments('12');
      setDueDate('');
      setIsModalOpen(false);
      loadDevices();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus?: string) => {
    const newStatus = currentStatus === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/devices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      loadDevices();
    } catch (err) {
      console.error('Error cambiando estado:', err);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('¿Estás seguro de dar de baja este equipo de la flota MDM?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/devices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadDevices();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDevices = devices.filter((dev) => {
    const matchesSearch =
      dev.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dev.buyerName && dev.buyerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dev.buyerDni && dev.buyerDni.includes(searchQuery)) ||
      (dev.imei && dev.imei.includes(searchQuery)) ||
      (dev.enrollmentCode && dev.enrollmentCode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || dev.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <p className="text-indigo-400 animate-pulse font-medium">Cargando Consola MDM...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-white">
      <Sidebar organizationName="ControlCell Corp" />

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* ENCABEZADO PROFESIONAL MDM */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111827] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg text-lg">📱</span>
              <h1 className="text-2xl font-bold tracking-tight text-white">Flota y Dispositivos MDM</h1>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Monitoreo en tiempo real, control de bloqueo remoto y auditoría de equipos financiados.
            </p>
          </div>
          <button
            onClick={() => {
              setDueDate(calculateDefaultDueDate('MENSUAL'));
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer flex items-center gap-2"
          >
            <span>➕</span> Registrar Nuevo Equipo
          </button>
        </div>

        {/* BARRA DE FILTROS Y BÚSQUEDA AVANZADA */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111827] border border-gray-800 p-4 rounded-2xl">
          <div className="w-full md:w-96 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">🔍</span>
            <input
              type="text"
              placeholder="Buscar por modelo, cliente, DNI o IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1f2937] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {[
              { label: 'Todos', value: 'ALL' },
              { label: 'Activos', value: 'ACTIVE' },
              { label: 'Pendientes', value: 'PENDING_ENROLLMENT' },
              { label: 'Bloqueados', value: 'LOCKED' },
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => setStatusFilter(st.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st.value
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-[#1f2937] text-gray-400 hover:text-white border border-gray-700/50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* LISTADO DE DISPOSITIVOS EN TARJETAS DE ALTO RENDIMIENTO */}
        {filteredDevices.length === 0 ? (
          <div className="text-center py-20 bg-[#111827] border border-gray-800 rounded-2xl space-y-3">
            <span className="text-4xl">🛡️</span>
            <p className="text-gray-300 font-medium">No se encontraron dispositivos en este filtro</p>
            <p className="text-xs text-gray-500">Intenta buscar con otro término o registra una nueva venta.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDevices.map((dev) => {
              const isLocked = dev.status === 'LOCKED';
              const isPending = dev.status === 'PENDING_ENROLLMENT';
              const paidCount = dev.paidInstallments || 0;
              const totalCount = dev.totalInstallments || 12;
              const progressPercentage = Math.min(100, Math.round((paidCount / totalCount) * 100));

              return (
                <div
                  key={dev.id}
                  className="bg-[#111827] border border-gray-800 hover:border-gray-700 transition-all rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-white tracking-wide">{dev.model}</h3>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${
                        isLocked
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : isPending
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {dev.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      {dev.buyerName && (
                        <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-lg font-medium flex items-center gap-1">
                          👤 {dev.buyerName} {dev.buyerDni ? `(DNI: ${dev.buyerDni})` : ''}
                        </span>
                      )}
                      <span className="bg-gray-800/80 px-3 py-1 rounded-lg font-mono text-gray-300">
                        🔑 QR: <strong className="text-white">{dev.enrollmentCode}</strong>
                      </span>
                      <span className="bg-gray-800/80 px-3 py-1 rounded-lg font-mono text-gray-300">
                        📱 IMEI: {dev.imei || 'Sin registrar (En espera)'}
                      </span>
                    </div>

                    {/* DETALLES DE FINANCIACIÓN Y PROGRESO */}
                    {(dev.price || dev.totalInstallments) && (
                      <div className="pt-3 border-t border-gray-800/80 space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-gray-500 block">Precio Total</span>
                            <span className="font-semibold text-white">${dev.price?.toLocaleString('es-AR') || '0'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Entrega Inicial</span>
                            <span className="font-semibold text-emerald-400">${dev.downPayment?.toLocaleString('es-AR') || '0'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Cuota ({dev.paymentFrequency || 'MENSUAL'})</span>
                            <span className="font-semibold text-indigo-300">${dev.installmentAmount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Progreso de Cuotas</span>
                            <span className="font-semibold text-white">{paidCount} de {totalCount} pagadas</span>
                          </div>
                        </div>

                        {/* BARRA DE PROGRESO */}
                        <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden mt-1">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACCIONES DE SEGURIDAD MDM */}
                  <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-800">
                    <button
                      onClick={() => handleToggleStatus(dev.id, dev.status)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-md ${
                        isLocked
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40 shadow-emerald-600/20'
                          : 'bg-red-600/80 hover:bg-red-600 text-white border-red-500/40 shadow-red-600/20'
                      }`}
                    >
                      {isLocked ? '🔓 Desbloquear Equipo' : '🔒 Bloquear MDM'}
                    </button>

                    <button
                      onClick={() => handleDeleteDevice(dev.id)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 border border-gray-700 transition-all cursor-pointer"
                      title="Eliminar registro"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL NUEVA VENTA / REGISTRO DE DISPOSITIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white">Registrar Nuevo Equipo y Financiación</h3>
                <p className="text-xs text-gray-400">Generación automática de código QR de enrolamiento MDM</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-xl cursor-pointer">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateDevice} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Modelo del Celular *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: iPhone 13 / Samsung S23"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">IMEI (Opcional)</label>
                  <input
                    type="text"
                    placeholder="15 dígitos o autodetectable"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-800">
                <p className="text-xs font-bold text-indigo-400 uppercase">👤 Datos del Comprador</p>
                <input
                  type="text"
                  placeholder="Nombre y Apellido del cliente"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="DNI / Cédula"
                    value={buyerDni}
                    onChange={(e) => setBuyerDni(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono / WhatsApp"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-800">
                <p className="text-xs font-bold text-emerald-400 uppercase">💵 Plan de Financiación</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Precio Total ($)</label>
                    <input
                      type="number"
                      placeholder="Ej: 500000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Entrega Inicial ($)</label>
                    <input
                      type="number"
                      placeholder="Ej: 100000"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Cuotas</label>
                    <input
                      type="number"
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Frecuencia</label>
                    <select
                      value={paymentFrequency}
                      onChange={(e) => handleFrequencyChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="SEMANAL">Semanal</option>
                      <option value="QUINCENAL">Quincenal</option>
                      <option value="MENSUAL">Mensual</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Valor Cuota</label>
                    <input
                      type="text"
                      readOnly
                      value={calculatedInstallment > 0 ? `$${calculatedInstallment.toLocaleString('es-AR', { maximumFractionDigits: 2 })}` : '$0'}
                      className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-indigo-500/50 text-indigo-300 font-bold rounded-xl text-sm"
                    />
                  </div>
                </div>

                {parsedPrice > 0 && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs flex justify-between items-center">
                    <span className="text-gray-300">Saldo a Financiar:</span>
                    <strong className="text-white">${balanceToFinance.toLocaleString('es-AR')}</strong>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Primer Vencimiento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Registrando...' : 'Guardar y Generar QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}