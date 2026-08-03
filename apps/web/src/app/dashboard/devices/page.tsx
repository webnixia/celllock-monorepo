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

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Crear Venta State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [model, setModel] = useState('');
  const [imei, setImei] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerDni, setBuyerDni] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [price, setPrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState('MENSUAL');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal QR / Enrolamiento State
  const [qrDevice, setQrDevice] = useState<Device | null>(null);

  const calculateDefaultDueDate = (frequency: string) => {
    const now = new Date();
    if (frequency === 'SEMANAL') now.setDate(now.getDate() + 7);
    else if (frequency === 'QUINCENAL') now.setDate(now.getDate() + 15);
    else now.setMonth(now.getMonth() + 1);
    return now.toISOString().split('T')[0];
  };

  const calculateNextDueDate = (currentDueDate?: string, frequency?: string) => {
    const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
    const targetDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;

    if (frequency === 'SEMANAL') {
      targetDate.setDate(targetDate.getDate() + 7);
    } else if (frequency === 'QUINCENAL') {
      targetDate.setDate(targetDate.getDate() + 15);
    } else {
      targetDate.setMonth(targetDate.getMonth() + 1);
    }
    return targetDate.toISOString().split('T')[0];
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

      if (!response.ok) throw new Error('Error al obtener dispositivos');
      const data = await response.json();
      if (Array.isArray(data)) setDevices(data);
    } catch (err) {
      console.error('Error cargando dispositivos:', err);
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

  const handleRegisterPayment = async (dev: Device) => {
    const total = dev.totalInstallments || 12;
    const currentPaid = dev.paidInstallments || 0;

    if (currentPaid >= total) {
      alert('¡Este equipo ya completó el 100% de las cuotas del plan de financiación!');
      return;
    }

    const nextPaid = currentPaid + 1;
    const nextDueDate = calculateNextDueDate(dev.dueDate, dev.paymentFrequency);

    if (!confirm(`¿Registrar pago de la cuota ${nextPaid}/${total} para ${dev.buyerName || dev.model}? Esto actualizará el vencimiento al ${nextDueDate} y desbloqueará el equipo si estaba en mora.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/v1/devices/${dev.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tenantId: DEMO_TENANT_ID,
          paidInstallments: nextPaid,
          dueDate: nextDueDate,
          status: 'ACTIVE',
        }),
      });

      if (!response.ok) throw new Error('Error al registrar el pago');
      loadDevices();
    } catch (err: any) {
      console.error('Error registrando pago:', err);
      alert(err.message || 'No se pudo registrar el pago');
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
        <p className="text-indigo-400 animate-pulse font-medium">Cargando flota de dispositivos...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-white">
      <Sidebar organizationName="ControlCell Corp" />

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#111827] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Flota y Dispositivos MDM</h1>
            <p className="text-xs text-gray-400 mt-1">Gestión integral de equipos, cobros de cuotas y enrolamiento</p>
          </div>
          <button
            onClick={() => {
              setDueDate(calculateDefaultDueDate('MENSUAL'));
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            + Registrar Nueva Venta / Financiación
          </button>
        </div>

        {/* BÚSQUEDA Y FILTROS */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111827] border border-gray-800 p-4 rounded-2xl">
          <input
            type="text"
            placeholder="Buscar por modelo, cliente, DNI o IMEI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 px-4 py-2 bg-[#1f2937] border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
          />

          <div className="flex items-center gap-2">
            {[
              { label: 'Todos', value: 'ALL' },
              { label: 'Activos', value: 'ACTIVE' },
              { label: 'Pendientes', value: 'PENDING_ENROLLMENT' },
              { label: 'Bloqueados', value: 'LOCKED' },
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => setStatusFilter(st.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
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

        {/* LISTADO */}
        {filteredDevices.length === 0 ? (
          <div className="text-center py-20 bg-[#111827] border border-gray-800 rounded-2xl space-y-3">
            <span className="text-4xl">📂</span>
            <p className="text-gray-300 font-medium">No se encontraron dispositivos registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredDevices.map((dev) => {
              const isLocked = dev.status === 'LOCKED';
              const isPending = dev.status === 'PENDING_ENROLLMENT';

              return (
                <div
                  key={dev.id}
                  className="bg-[#111827] border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-white">{dev.model}</h3>
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase border ${
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
                        <span className="bg-indigo-500/10 text-indigo-300 px-3 py-1 rounded-lg font-medium">
                          👤 {dev.buyerName} {dev.buyerDni ? `(DNI: ${dev.buyerDni})` : ''}
                        </span>
                      )}
                      
                      {/* BOTÓN / ETIQUETA QR PARA ABRIR EL MODAL DE ENROLAMIENTO */}
                      <button
                        onClick={() => setQrDevice(dev)}
                        className="bg-gray-800 hover:bg-gray-700 text-indigo-400 hover:text-indigo-300 px-3 py-1 rounded-lg font-mono transition-all cursor-pointer flex items-center gap-1.5 border border-indigo-500/30"
                      >
                        <span>🔲</span> QR: <strong className="text-white underline">{dev.enrollmentCode || 'Ver Código'}</strong>
                      </button>

                      <span className="bg-gray-800 px-3 py-1 rounded-lg font-mono text-gray-300">
                        💻 IMEI: {dev.imei || 'Pendiente'}
                      </span>
                      {dev.dueDate && (
                        <span className="bg-gray-800 px-3 py-1 rounded-lg text-gray-300">
                          📅 Vence: <strong className="text-white">{dev.dueDate}</strong>
                        </span>
                      )}
                    </div>

                    {(dev.price || dev.totalInstallments) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2 border-t border-gray-800">
                        <div>
                          <span className="text-gray-500 block">Precio Total</span>
                          <span className="font-semibold text-white">${dev.price?.toLocaleString('es-AR') || '0'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Entrega Inicial</span>
                          <span className="font-semibold text-emerald-400">${dev.downPayment?.toLocaleString('es-AR') || '0'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Cuota Mensual</span>
                          <span className="font-semibold text-indigo-300">${dev.installmentAmount?.toLocaleString('es-AR', { maximumFractionDigits: 2 }) || '0'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Avance de Cuotas</span>
                          <span className="font-semibold text-emerald-400">{dev.paidInstallments || 0} de {dev.totalInstallments || 12} pagadas</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ACCIONES */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleRegisterPayment(dev)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500/40 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                    >
                      <span>💵</span> Registrar Pago
                    </button>

                    <button
                      onClick={() => handleToggleStatus(dev.id, dev.status)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border cursor-pointer ${
                        isLocked
                          ? 'bg-indigo-600 text-white border-indigo-500/40'
                          : 'bg-red-600 text-white border-red-500/40'
                      }`}
                    >
                      {isLocked ? 'Desbloquear' : 'Bloquear'}
                    </button>
                    <button
                      onClick={() => handleDeleteDevice(dev.id)}
                      className="px-3 py-2 text-xs font-semibold rounded-xl bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-700 cursor-pointer"
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

      {/* MODAL CÓDIGO QR / ENROLAMIENTO */}
      {qrDevice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white text-left">Guía de Enrolamiento MDM</h3>
              <button onClick={() => setQrDevice(null)} className="text-gray-400 hover:text-white text-xl cursor-pointer">✕</button>
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/30 p-4 rounded-xl space-y-1">
              <p className="text-xs text-indigo-400 font-semibold uppercase">Equipo Asignado</p>
              <p className="text-lg font-bold text-white">{qrDevice.model}</p>
              {qrDevice.buyerName && <p className="text-xs text-gray-300">Cliente: {qrDevice.buyerName}</p>}
            </div>

            {/* CAJA DEL CÓDIGO QR / CÓDIGO DE ENROLAMIENTO */}
            <div className="bg-white p-6 rounded-2xl space-y-3 shadow-inner inline-block w-full">
              <div className="w-40 h-40 mx-auto bg-gray-900 rounded-xl flex items-center justify-center p-4 border-4 border-dashed border-indigo-500">
                <span className="text-white font-mono text-xl font-black tracking-widest">{qrDevice.enrollmentCode || 'CC-SYNC'}</span>
              </div>
              <p className="text-[11px] text-gray-600 font-semibold uppercase tracking-wider">Código Único de Vinculación</p>
            </div>

            <div className="text-left bg-[#1f2937]/50 p-4 rounded-xl space-y-2 text-xs text-gray-300 border border-gray-800">
              <p className="font-bold text-indigo-400 uppercase">Pasos para el técnico en el local:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-400">
                <li>Instale la app de ControlCell en el celular del cliente.</li>
                <li>Ingrese el código <strong className="text-white font-mono">{qrDevice.enrollmentCode}</strong> en la app.</li>
                <li>El sistema enlazará el IMEI automáticamente y dejará el equipo activo.</li>
              </ol>
            </div>

            <button
              onClick={() => setQrDevice(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl uppercase tracking-wider cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      )}

      {/* MODAL NUEVA VENTA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Registrar Nueva Venta / Financiación</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-xl cursor-pointer">✕</button>
            </div>

            {errorMsg && <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">⚠️ {errorMsg}</div>}

            <form onSubmit={handleCreateDevice} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Modelo del Celular *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Samsung S23 Ultra"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">IMEI (Opcional)</label>
                <input
                  type="text"
                  placeholder="Opcional (se autodetecta)"
                  value={imei}
                  onChange={(e) => setImei(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-gray-800">
                <p className="text-xs font-bold text-indigo-400 uppercase">👤 Comprador</p>
                <input
                  type="text"
                  placeholder="Nombre y Apellido"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="DNI"
                    value={buyerDni}
                    onChange={(e) => setBuyerDni(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-800">
                <p className="text-xs font-bold text-emerald-400 uppercase">💵 Financiación</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Precio Total ($)</label>
                    <input
                      type="number"
                      placeholder="500000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Entrega Inicial ($)</label>
                    <input
                      type="number"
                      placeholder="50000"
                      value={downPayment}
                      onChange={(e) => setDownPayment(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Cuota Valor</label>
                    <input
                      type="text"
                      readOnly
                      value={installmentAmount ? `$${installmentAmount}` : '$0'}
                      className="w-full px-3.5 py-2.5 bg-[#1f2937] border border-indigo-500/50 text-indigo-300 font-bold rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Vencimiento</label>
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
                  className="px-4 py-2.5 bg-gray-800 text-gray-300 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/30 cursor-pointer"
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