import React, { useState } from 'react';
import { useExperience, AdminSettings } from '@/context/ExperienceContext';
import { Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminPanel() {
  const { admin, setAdmin, resetExperience } = useExperience();
  const [open, setOpen] = useState(false);

  const update = (partial: Partial<AdminSettings>) => setAdmin({ ...admin, ...partial });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-all opacity-30 hover:opacity-100"
        title="Admin"
      >
        <Settings className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-display font-semibold text-foreground">Painel Admin</h3>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {/* Intensity */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Intensidade da simulação: {admin.simulationIntensity}
          </label>
          <input
            type="range" min="1" max="10" value={admin.simulationIntensity}
            onChange={e => update({ simulationIntensity: Number(e.target.value) })}
            className="w-full mt-2 accent-primary"
          />
        </div>

        {/* Force result */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">
            Resultado
          </label>
          <div className="flex gap-2">
            {(['auto', 'stable', 'break'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => update({ forceResult: opt })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  admin.forceResult === opt ? 'gradient-bg text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {opt === 'auto' ? 'Auto' : opt === 'stable' ? 'Estável' : 'Quebra'}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">
            Duração da animação
          </label>
          <div className="flex gap-2">
            {(['short', 'medium', 'long'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => update({ animationDuration: opt })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  admin.animationDuration === opt ? 'gradient-bg text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {opt === 'short' ? 'Curta' : opt === 'medium' ? 'Média' : 'Longa'}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1 block">
            Mensagem estável
          </label>
          <input
            type="text"
            value={admin.stableMessage}
            onChange={e => update({ stableMessage: e.target.value })}
            className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1 block">
            Mensagem quebra
          </label>
          <input
            type="text"
            value={admin.breakMessage}
            onChange={e => update({ breakMessage: e.target.value })}
            className="w-full bg-muted rounded-lg px-3 py-2 text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Mode */}
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2 block">
            Modo
          </label>
          <div className="flex gap-2">
            {(['event', 'demo'] as const).map(opt => (
              <button
                key={opt}
                onClick={() => update({ mode: opt })}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  admin.mode === opt ? 'gradient-bg text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {opt === 'event' ? 'Evento' : 'Demo'}
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <Button variant="destructive" size="sm" onClick={resetExperience} className="mt-4">
          Reset geral
        </Button>
      </div>
    </div>
  );
}
