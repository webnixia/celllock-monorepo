'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('ControlCell Corp');
  const [whatsapp, setWhatsapp] = useState('+54 9 11 0000-0000');
  const [lockMessage, setLockMessage] = useState(
    '⚠️ EQUIPO BLOQUEADO POR MORA. Comuníquese urgente al WhatsApp de la tienda para regularizar su pago y desbloquear.'
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Cargar datos guardados previamente si existen
    const savedSettings = localStorage.getItem('store_settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.storeName) setStoreName(parsed.storeName);
        if (parsed.whatsapp) setWhatsapp(parsed.whatsapp);
        if (parsed.lockMessage) setLockMessage(parsed.lockMessage);
      } catch (e) {}
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem(
      'store_settings',
      JSON.stringify({ storeName, whatsapp, lockMessage })
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-white">
      <Sidebar organizationName={storeName} />

      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        <div className="bg-[#111827] border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold tracking-tight text-white">Configuración del Local</h1>
          <p className="text-xs text-gray-400 mt-1">
            Personaliza los parámetros de tu negocio y el mensaje de bloqueo inteligente MDM.
          </p>
        </div>

        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
            <span>✅</span> Configuración guardada correctamente.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* DATOS COMERCIALES */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-indigo-400 flex items-center gap-2">
              🏪 Datos del Comercio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  Nombre del Local / Tienda
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                  WhatsApp de Cobros / Soporte
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* MENSAJE DE BLOQUEO MDM */}
          <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-red-400 flex items-center gap-2">
              🔒 Mensaje de Bloqueo Inteligente (MDM)
            </h2>
            <p className="text-xs text-gray-400">
              Este es el texto exacto que aparecerá en pantalla completa en el celular del cliente cuando el equipo sea bloqueado por falta de pago.
            </p>
            <div>
              <textarea
                rows={4}
                value={lockMessage}
                onChange={(e) => setLockMessage(e.target.value)}
                className="w-full p-4 bg-[#1f2937] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}