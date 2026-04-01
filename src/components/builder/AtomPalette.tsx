import React from 'react';
import { ATOM_COLORS } from '@/data/presetMolecules';
import { VALENCE } from '@/lib/moleculeEngine';

const AVAILABLE_ATOMS = [
  { symbol: 'C', name: 'Carbono', valence: 4 },
  { symbol: 'O', name: 'Oxigênio', valence: 2 },
  { symbol: 'N', name: 'Nitrogênio', valence: 3 },
  { symbol: 'H', name: 'Hidrogênio', valence: 1 },
];

interface AtomPaletteProps {
  selectedAtomType: string;
  onSelect: (symbol: string) => void;
}

export default function AtomPalette({ selectedAtomType, onSelect }: AtomPaletteProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Átomos</p>
      <div className="grid grid-cols-2 gap-2">
        {AVAILABLE_ATOMS.map(a => {
          const isSelected = selectedAtomType === a.symbol;
          return (
            <button
              key={a.symbol}
              onClick={() => onSelect(a.symbol)}
              className={`flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                isSelected ? 'glass-card glow-border' : 'hover:bg-muted/50'
              }`}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border border-border/30 shrink-0"
                style={{ backgroundColor: ATOM_COLORS[a.symbol], textShadow: '0 1px 2px rgba(0,0,0,0.5)', color: '#fff' }}
              >
                {a.symbol}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-foreground leading-tight">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">val. {a.valence}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
