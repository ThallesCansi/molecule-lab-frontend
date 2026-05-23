import React from 'react';
import { ATOM_COLORS } from '@/data/presetMolecules';
import { VALENCE } from '@/lib/moleculeEngine';

const ATOM_GROUPS = [
  {
    label: 'Mais usados',
    atoms: [
      { symbol: 'C', name: 'Carbono' },
      { symbol: 'O', name: 'Oxigênio' },
      { symbol: 'N', name: 'Nitrogênio' },
      { symbol: 'H', name: 'Hidrogênio' },
    ],
  },
  {
    label: 'Outros',
    atoms: [
      { symbol: 'S', name: 'Enxofre' },
      { symbol: 'P', name: 'Fósforo' },
      { symbol: 'F', name: 'Flúor' },
      { symbol: 'Cl', name: 'Cloro' },
      { symbol: 'Br', name: 'Bromo' },
    ],
  },
];

interface AtomPaletteProps {
  selectedAtomType: string;
  onSelect: (symbol: string) => void;
}

export default function AtomPalette({ selectedAtomType, onSelect }: AtomPaletteProps) {
  return (
    <div className="space-y-3">
      {ATOM_GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">{group.label}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {group.atoms.map(a => {
              const isSelected = selectedAtomType === a.symbol;
              const valence = VALENCE[a.symbol] ?? 4;
              return (
                <button
                  key={a.symbol}
                  onClick={() => onSelect(a.symbol)}
                  className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                    isSelected ? 'glass-card glow-border' : 'hover:bg-muted/50'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-foreground shrink-0"
                    style={{ backgroundColor: ATOM_COLORS[a.symbol], textShadow: '0 1px 2px rgba(0,0,0,0.5)', color: '#fff' }}
                  >
                    {a.symbol}
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-medium text-foreground leading-tight">{a.name}</p>
                    <p className="text-[9px] text-muted-foreground">val. {valence}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
