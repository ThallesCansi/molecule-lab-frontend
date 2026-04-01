import React, { useState, useRef, useCallback } from 'react';
import { useExperience, Atom, Bond, MoleculeData } from '@/context/ExperienceContext';
import { ATOM_COLORS, presetMolecules } from '@/data/presetMolecules';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Flame, RotateCcw, Sparkles, Hand, Link2, Trash2 } from 'lucide-react';

const AVAILABLE_ATOMS = [
  { symbol: 'H', name: 'Hidrogênio', color: ATOM_COLORS.H },
  { symbol: 'C', name: 'Carbono', color: ATOM_COLORS.C },
  { symbol: 'O', name: 'Oxigênio', color: ATOM_COLORS.O },
  { symbol: 'N', name: 'Nitrogênio', color: ATOM_COLORS.N },
];

type Tool = 'add' | 'bond' | 'move' | 'delete';

let idCounter = 0;
const genId = () => `a${++idCounter}`;

export default function BuilderScreen() {
  const { setScreen, setMolecule, molecule } = useExperience();
  const [atoms, setAtoms] = useState<Atom[]>(molecule.atoms);
  const [bonds, setBonds] = useState<Bond[]>(molecule.bonds);
  const [selectedAtomType, setSelectedAtomType] = useState('C');
  const [tool, setTool] = useState<Tool>('add');
  const [bondStart, setBondStart] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [tab, setTab] = useState<'free' | 'guided' | 'presets'>('free');
  const svgRef = useRef<SVGSVGElement>(null);

  const getMousePos = useCallback((e: React.MouseEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool !== 'add') return;
    const pos = getMousePos(e);
    const newAtom: Atom = {
      id: genId(),
      symbol: selectedAtomType,
      x: pos.x,
      y: pos.y,
      color: ATOM_COLORS[selectedAtomType] || '#888',
    };
    setAtoms(prev => [...prev, newAtom]);
  };

  const handleAtomClick = (atomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === 'bond') {
      if (!bondStart) {
        setBondStart(atomId);
      } else if (bondStart !== atomId) {
        const exists = bonds.some(
          b => (b.from === bondStart && b.to === atomId) || (b.from === atomId && b.to === bondStart)
        );
        if (!exists) {
          setBonds(prev => [...prev, { id: genId(), from: bondStart, to: atomId }]);
        }
        setBondStart(null);
      }
    } else if (tool === 'delete') {
      setAtoms(prev => prev.filter(a => a.id !== atomId));
      setBonds(prev => prev.filter(b => b.from !== atomId && b.to !== atomId));
    }
  };

  const handleMouseDown = (atomId: string, e: React.MouseEvent) => {
    if (tool === 'move') {
      e.stopPropagation();
      setDragging(atomId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const pos = getMousePos(e);
      setAtoms(prev => prev.map(a => a.id === dragging ? { ...a, x: pos.x, y: pos.y } : a));
    }
  };

  const handleMouseUp = () => setDragging(null);

  const handleTest = () => {
    setMolecule({ atoms, bonds });
    setScreen('simulation');
  };

  const handleReset = () => {
    setAtoms([]);
    setBonds([]);
    setBondStart(null);
  };

  const loadPreset = (m: MoleculeData) => {
    setAtoms(m.atoms);
    setBonds(m.bonds);
    setTab('free');
  };

  const hasContent = atoms.length > 0;

  const guidedSteps = [
    { text: '1. Selecione um átomo na barra lateral', done: atoms.length > 0 },
    { text: '2. Clique na área para posicionar', done: atoms.length > 0 },
    { text: '3. Adicione mais átomos', done: atoms.length > 1 },
    { text: '4. Use a ferramenta "Ligar" para criar ligações', done: bonds.length > 0 },
    { text: '5. Teste sua molécula!', done: false },
  ];

  return (
    <div className="min-h-screen flex flex-col gradient-bg-subtle">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={() => setScreen('landing')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h2 className="font-display text-lg font-semibold gradient-text">Construa sua molécula</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!hasContent}>
            <RotateCcw className="w-4 h-4 mr-1" /> Limpar
          </Button>
          <Button variant="hero" size="sm" onClick={handleTest} disabled={atoms.length < 2}>
            <Flame className="w-4 h-4 mr-1" /> Testar
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border/50 p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Mode tabs */}
          <div className="flex gap-1 glass-card p-1 rounded-xl">
            {([['free', 'Livre'], ['guided', 'Guiado'], ['presets', 'Prontas']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 text-sm py-2 rounded-lg transition-all font-medium ${
                  tab === key ? 'gradient-bg text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === 'free' && (
            <>
              {/* Tools */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Ferramentas</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    ['add', 'Adicionar', Sparkles],
                    ['bond', 'Ligar', Link2],
                    ['move', 'Mover', Hand],
                    ['delete', 'Apagar', Trash2],
                  ] as const).map(([key, label, Icon]) => (
                    <button
                      key={key}
                      onClick={() => { setTool(key); setBondStart(null); }}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl text-xs transition-all ${
                        tool === key ? 'glass-card glow-border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Atoms */}
              <div>
                <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Átomos</p>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_ATOMS.map(a => (
                    <button
                      key={a.symbol}
                      onClick={() => { setSelectedAtomType(a.symbol); setTool('add'); }}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        selectedAtomType === a.symbol && tool === 'add'
                          ? 'glass-card glow-border'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-border/50"
                        style={{ backgroundColor: a.color, color: a.symbol === 'H' || a.symbol === 'C' ? '#fff' : '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                      >
                        {a.symbol}
                      </div>
                      <span className="text-xs text-foreground">{a.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {bondStart && (
                <div className="glass-card p-3 text-center text-sm text-accent animate-scale-in">
                  Clique em outro átomo para criar a ligação
                </div>
              )}
            </>
          )}

          {tab === 'guided' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-foreground font-medium">Siga os passos:</p>
              {guidedSteps.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl text-sm ${step.done ? 'glass-card text-accent' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'gradient-bg text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  {step.text}
                </div>
              ))}
            </div>
          )}

          {tab === 'presets' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Escolha uma molécula pronta:</p>
              {presetMolecules.map((m, i) => (
                <button
                  key={i}
                  onClick={() => loadPreset(m)}
                  className="glass-card p-4 text-left rounded-xl hover:glow-border transition-all"
                >
                  <p className="font-display font-semibold text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Canvas */}
        <main className="flex-1 relative p-4">
          <svg
            ref={svgRef}
            className="w-full h-full min-h-[400px] rounded-2xl border border-border/30 bg-background/30 backdrop-blur-sm cursor-crosshair"
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Bonds */}
            {bonds.map(bond => {
              const from = atoms.find(a => a.id === bond.from);
              const to = atoms.find(a => a.id === bond.to);
              if (!from || !to) return null;
              return (
                <line
                  key={bond.id}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke="hsl(270, 10%, 50%)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              );
            })}

            {/* Atoms */}
            {atoms.map(atom => {
              const radius = atom.symbol === 'H' ? 18 : 24;
              return (
                <g
                  key={atom.id}
                  onClick={(e) => handleAtomClick(atom.id, e)}
                  onMouseDown={(e) => handleMouseDown(atom.id, e)}
                  style={{ cursor: tool === 'move' ? 'grab' : 'pointer' }}
                >
                  {/* Glow */}
                  <circle cx={atom.x} cy={atom.y} r={radius + 8} fill={atom.color} opacity="0.15" />
                  {/* Circle */}
                  <circle
                    cx={atom.x} cy={atom.y} r={radius}
                    fill={atom.color}
                    stroke={bondStart === atom.id ? 'hsl(320, 70%, 55%)' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={bondStart === atom.id ? 3 : 1.5}
                  />
                  {/* Label */}
                  <text
                    x={atom.x} y={atom.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize="14"
                    fontWeight="bold"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', pointerEvents: 'none' }}
                  >
                    {atom.symbol}
                  </text>
                </g>
              );
            })}

            {/* Empty state */}
            {atoms.length === 0 && (
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="hsl(270, 10%, 40%)" fontSize="16">
                Clique aqui para adicionar átomos
              </text>
            )}
          </svg>

          {/* Floating hint */}
          {atoms.length > 0 && atoms.length < 3 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-full text-sm text-muted-foreground animate-fade-in">
              💡 Experimente combinar átomos diferentes!
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
