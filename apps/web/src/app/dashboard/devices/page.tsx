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

const DEMO_TENANT_ID = 'tenant-demo-id';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

export default function DashboardPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Campos Básicos
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');

  // Comprador
  const [buyerName, setBuyerName] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');

  // Financiamiento y Calculadora
  const [price, setPrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState('MENSUAL');
  const [dueDate, setDueDate] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 🧮 1. CÁLCULO AUTOMÁTICO DE VENCIMIENTO SEGÚN FRECUENCIA
  const calculateDefaultDueDate = (frequency: string) => {
    const now = new Date();
    if (frequency === 'SEMANAL') {
      now.setDate(now.getDate() + 7);
    } else if (frequency === 'QUINCENAL') {
      now.setDate(now.getDate() + 15);
    } else {
      // MENSUAL
      now.setMonth(now.getMonth() + 1);
    }
    return now.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  };

  const handleFrequencyChange = (newFreq: string) => {
    setPaymentFrequency(newFreq);
    setDueDate(calculateDefaultDueDate(newFreq));
  };

  // 🧮 2. CALCULADORA DE CUOTAS Y MONEDA EN TIEMPO REAL
  const parsedPrice = parseFloat(price) || 0;
  const parsedDownPayment = parseFloat(downPayment) || 0;
  const parsedTotalInstallments = parseInt(totalInstallments) || 0;

  const balanceToFinance = Math.max(0, parsedPrice - parsedDownPayment);
  const calculatedInstallment = parsedTotalInstallments > 0 ? balanceToFinance / parsedTotalInstallments : 0;

  useEffect(() => {
    if (balanceToFinance > 0 && parsedTotalInstallments > 0) {
      setInstallmentAmount(calculatedInstallment.toFixed(2));
    } else {
      setInstallmentAmount('');
    }
  }, [price, downPayment, totalInstallments]);

  const loadDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/devices?tenantId=${DEMO_TENANT_ID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Error al obtener dispositivos');
      }

      const data = await response.json();
      if (Array.isArray(data)) setDevices(data);
    } catch (err) {
      console.error('Error al cargar dispositivos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
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
      const response = await fetch(`${API_URL}/api/v1/devices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: DEMO_TENANT_ID,
          model: model.trim(),
          imei: imei.trim() || null,
          buyerName: buyerName.trim() || null,
          buyerDni: buyerDni.trim() || null,
          buyerPhone: buyerPhone.trim() || null,
          price: price ? parseFloat(price) : null,
          downPayment: downPayment ? parseFloat(downPayment) : null,
          installmentAmount: installmentAmount ? parseFloat(installmentAmount) : null,
          totalInstallments: totalInstallments ? parseInt(totalInstallments) : null,
          paymentFrequency,
          dueDate: dueDate || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Error al registrar el dispositivo');
      }

      // Resetear campos
      setModel('');
      setImei('');
      setBuyerName('');
      setBuyerDni('');
      setBuyerPhone('');
      setPrice('');
      setDownPayment('');
      setInstallmentAmount('');
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
      await fetch(`${API_URL}/api/v1/devices/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tenantId: DEMO_TENANT_ID, status: newStatus }),
      });
      loadDevices();
    } catch (err) {
      console.error('Error cambiando estado:', err);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    if (!confirm('¿Seguro de dar de baja este equipo?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/v1/devices/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      loadDevices();
    } catch (err) {
      console.error(err);
    }
  };

  const getPaymentStatus = (dateStr?: string) => {
    if (!dateStr) return { label: 'Sin Vencimiento', color: 'text-gray-400 bg-gray-500/10 border-gray-500/20' };
    const now = new Date();
    const due = new Date(dateStr);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) return { label: '⚠️ VENCIDO', color: 'text-red-400 bg-red-500/10 border-red-500/30 font-bold' };
    if (diffDays <= 5) return { label: `⏰ Vence en ${diffDays}d`, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30 font-bold animate-pulse' };
    return { label: '🟢 Al Día', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Cargando datos de ControlCell...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-white">
      <Sidebar organizationName="ControlCell Corp" />

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center bg-[#111827] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gestión de Financiación y Dispositivos</h1>
            <p className="text-xs text-gray-400 mt-1">Cálculo automático de cuotas, financiación y bloqueo inteligente MDM</p>
          </div>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs font-semibold uppercase text-gray-400">Total Equipos</p>
            <p className="text-3xl font-bold mt-2">{devices.length}</p>
          </div>
          <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs font-semibold uppercase text-gray-400">Activos / Al Día</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">
              {devices.filter((d) => d.status === 'ACTIVE').length}
            </p>
          </div>
          <div className="bg-[#111827] border border-gray-800 p-5 rounded-2xl shadow-lg">
            <p className="text-xs font-semibold uppercase text-gray-400">Bloqueados por Mora</p>
            <p className="text-3xl font-bold text-red-400 mt-2">
              {devices.filter((d) => d.status === 'LOCKED').length}
            </p>
          </div>
        </div>

        {/* LISTADO DE DISPOSITIVOS */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Equipos y Ventas Registradas</h2>
            <button
              onClick={() => {
                setDueDate(calculateDefaultDueDate('MENSUAL'));
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              + Nueva Venta / Financiación
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
              <p className="text-gray-500 text-sm">No hay dispositivos registrados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devices.map((dev) => {
                const isLocked = dev.status === 'LOCKED';
                const isPending = dev.status === 'PENDING_ENROLLMENT';
                const paymentInfo = getPaymentStatus(dev.dueDate);

                return (
                  <div key={dev.id} className="p-4 bg-[#1f2937] border border-gray-700/60 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-base">{dev.model}</p>
                        {dev.buyerName && (
                          <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-medium">
                            👤 {dev.buyerName} {dev.buyerDni ? `(DNI: ${dev.buyerDni})` : ''}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400">
                        {dev.imei ? (
                          <>IMEI: <span className="text-indigo-300 font-mono">{dev.imei}</span></>
                        ) : (
                          <span className="text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            📲 Código QR / Enrolamiento: <strong className="font-mono text-white">{dev.enrollmentCode}</strong>
                          </span>
                        )}
                      </p>
                      
                      {/* INFORMACIÓN DE PLAN Y CUOTAS CON MONEDA */}
                      {(dev.price || dev.totalInstallments) && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-300 pt-1">
                          {dev.price && <p>💵 Precio: <span className="font-semibold text-white">${dev.price.toLocaleString('es-AR')}</span></p>}
                          {dev.downPayment && <p>💰 Entrega: <span className="font-semibold text-emerald-400">${dev.downPayment.toLocaleString('es-AR')}</span></p>}
                          {dev.installmentAmount && (
                            <p>📊 Cuota ({dev.paymentFrequency || 'MENSUAL'}): <span className="font-semibold text-indigo-300">${dev.installmentAmount.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></p>
                          )}
                          {dev.totalInstallments && (
                            <p>🔢 Avance: <span className="font-semibold text-white">{dev.paidInstallments || 0}/{dev.totalInstallments} cuotas</span></p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`text-xs px-3 py-1 rounded-lg border font-medium ${paymentInfo.color}`}>
                        {paymentInfo.label}
                      </span>

                      <span className={`text-xs px-3 py-1 rounded-full font-medium border ${
                        isLocked
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : isPending
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {dev.status}
                      </span>

                      <button
                        onClick={() => handleToggleStatus(dev.id, dev.status)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer font-medium ${
                          isLocked
                            ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {isLocked ? 'Desbloquear' : 'Bloquear'}
                      </button>

                      <button
                        onClick={() => handleDeleteDevice(dev.id)}
                        className="px-3 py-1.5 text-xs rounded-lg border bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-500/30 transition-all cursor-pointer font-medium"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* MODAL CON CALCULADORA, FORMATO PUNTOS/COMAS Y AUTO VENCIMIENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Registrar Nueva Venta / Financiación</h3>
                <p className="text-xs text-gray-400">Cálculo de cuotas y vencimiento automático</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-lg font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateDevice} className="space-y-4">
              {/* EQUIPO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Modelo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Samsung S23 Ultra"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f2937] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">IMEI (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Opcional (se autodetecta)"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f2937] border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* COMPRADOR */}
              <div className="space-y-2 pt-2 border-t border-gray-800">
                <p className="text-xs font-bold text-indigo-400 uppercase">👤 Datos del Comprador</p>
                <div>
                  <input
                    type="text"
                    placeholder="Nombre y Apellido (ej: Juan Pérez)"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f2937] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="DNI / Cédula"
                    value={buyerDni}
                    onChange={(e) => setBuyerDni(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f2937] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono (WhatsApp)"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f2937] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* FINANCIACIÓN Y CALCULADORA CON PUNTOS Y COMAS */}
              <div className="space-y-3 pt-2 border-t border-gray-800">
                <p className="text-xs font-bold text-emerald-400 uppercase">💵 Plan de Financiación</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-gray-400 uppercase">
                        Precio Total ($)
                      </label>
                      {parsedPrice > 0 && (
                        <span className="text-xs text-emerald-400 font-bold">
                          ${parsedPrice.toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder="Ej: 900000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1f2937] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-gray-400 uppercase">
                        Entrega Inicial ($)
                      </label>
                      {parsedDownPayment > 0 && (
                        <span className="text-xs text-emerald-400 font-bold">
                          ${parsedDownPayment.toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      placeholder="Ej: 100000"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1f2937] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Cant. Cuotas</label>
                    <input
                      type="number"
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1f2937] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Frecuencia</label>
                    <select
                      value={paymentFrequency}
                      onChange={(e) => handleFrequencyChange(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1f2937] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="SEMANAL">Semanal (7 días)</option>
                      <option value="QUINCENAL">Quincenal (15 días)</option>
                      <option value="MENSUAL">Mensual (1 mes)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Valor Cuota ($)</label>
                    <input
                      type="text"
                      readOnly
                      value={
                        calculatedInstallment > 0
                          ? `$ ${calculatedInstallment.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '$ 0,00'
                      }
                      className="w-full px-3 py-2 bg-[#1f2937] border border-indigo-500/50 text-indigo-300 font-bold rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* TARJETA DE RESUMEN FINANCIERO CON PUNTOS */}
                {parsedPrice > 0 && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-gray-300">
                      <span>Saldo a Financiar:</span>
                      <strong className="text-white">${balanceToFinance.toLocaleString('es-AR')}</strong>
                    </div>
                    <div className="flex justify-between text-indigo-300 font-semibold">
                      <span>Plan:</span>
                      <span>
                        {parsedTotalInstallments} cuotas de ${calculatedInstallment.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({paymentFrequency.toLowerCase()})
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                    Próximo Vencimiento <span className="text-indigo-400 font-normal">(Auto-calculado)</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1f2937] border border-indigo-500/40 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* BOTONES */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Guardar Venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}