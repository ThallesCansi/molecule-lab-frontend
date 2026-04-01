import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Atom } from '@/context/ExperienceContext';
import { BondWithOrder, getRemainingValence, getCandidatePositions, BOND_LENGTH } from '@/lib/moleculeEngine';
import { ATOM_COLORS } from '@/data/presetMolecules';

type Tool = 'select' | 'add' | 'move' | 'delete';

interface BuilderCanvasProps {
  atoms: Atom[];
  bonds: BondWithOrder[];
  activeAtomId: string | null;
  selectedAtomType: string;
  showHydrogens: boolean;
  implicitH: { hydrogenAtoms: Atom[]; hydrogenBonds: BondWithOrder[] };
  tool: Tool;
  onCanvasClick: (x: number, y: number) => void;
  onAtomClick: (atomId: string) => void;
  onAtomSelect: (atomId: string | null) => void;
  onAtomDelete: (atomId: string) => void;
  onBondClick: (bondId: string) => void;
  onAtomMove: (atomId: string, x: number, y: number) => void;
  onMoveEnd: () => void;
  getGhostPosition: (pos: { x: number; y: number }) => { x: number; y: number };
  findAtomAt: (pos: { x: number; y: number }) => Atom | null;
}

export default function BuilderCanvas({
  atoms, bonds, activeAtomId, selectedAtomType, showHydrogens, implicitH,
  tool, onCanvasClick, onAtomClick, onAtomSelect, onAtomDelete, onBondClick, onAtomMove, onMoveEnd,
  getGhostPosition, findAtomAt,
}: BuilderCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const getMousePos = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (dragging) return;
    const pos = getMousePos(e);

    if (tool === 'select') {
      const existing = findAtomAt(pos);
      if (existing) {
        // Toggle selection
        onAtomSelect(existing.id === activeAtomId ? null : existing.id);
      } else {
        onAtomSelect(null);
      }
    } else if (tool === 'add') {
      const existing = findAtomAt(pos);
      if (existing) {
        onAtomClick(existing.id);
      } else {
        onCanvasClick(pos.x, pos.y);
      }
    }
  };

  const handleAtomMouseDown = (atomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === 'move') {
      setDragging(atomId);
    } else if (tool === 'delete') {
      onAtomDelete(atomId);
    } else if (tool === 'add') {
      onAtomClick(atomId);
    } else if (tool === 'select') {
      onAtomSelect(atomId === activeAtomId ? null : atomId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setMousePos(pos);
    if (dragging) onAtomMove(dragging, pos.x, pos.y);
  };

  const handleMouseUp = () => {
    if (dragging) { setDragging(null); onMoveEnd(); }
  };

  const activeAtom = activeAtomId ? atoms.find(a => a.id === activeAtomId) : null;
  const ghostOverAtom = mousePos ? findAtomAt(mousePos) : null;

  const ghostPos = (tool === 'add' && mousePos && activeAtom && !ghostOverAtom)
    ? getGhostPosition(mousePos)
    : null;

  const candidateHints = useMemo(() => {
    if (tool !== 'add' || !activeAtom) return [];
    const remaining = getRemainingValence(activeAtomId!, atoms, bonds);
    if (remaining <= 0) return [];
    return getCandidatePositions(activeAtom, atoms, bonds, Math.min(remaining, 4));
  }, [tool, activeAtom, activeAtomId, atoms, bonds]);

  const displayAtoms = showHydrogens ? [...atoms, ...implicitH.hydrogenAtoms] : atoms;
  const displayBonds = showHydrogens ? [...bonds, ...implicitH.hydrogenBonds] : bonds;

  const cursorStyle = tool === 'add' ? 'crosshair' : tool === 'move' ? (dragging ? 'grabbing' : 'grab') : tool === 'select' ? 'default' : 'default';

  const renderBond = (bond: BondWithOrder, isImplicit = false) => {
    const from = displayAtoms.find(a => a.id === bond.from);
    const to = displayAtoms.find(a => a.id === bond.to);
    if (!from || !to) return null;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const opacity = isImplicit ? 0.25 : 0.8;
    const strokeColor = isImplicit ? 'hsl(var(--muted-foreground))' : 'hsl(var(--foreground) / 0.5)';

    if (bond.order === 1) {
      return (
        <line key={bond.id}
          x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke={strokeColor} strokeWidth={isImplicit ? 1.5 : 3} strokeLinecap="round" opacity={opacity}
          className={tool === 'delete' ? 'cursor-pointer hover:opacity-100' : ''}
          onClick={(e) => { e.stopPropagation(); if (tool === 'delete') onBondClick(bond.id); }}
        />
      );
    }

    const gap = bond.order === 2 ? 4 : 5;
    const offsets = bond.order === 2 ? [-gap, gap] : [-gap, 0, gap];
    return (
      <g key={bond.id}>
        {offsets.map((off, i) => (
          <line key={`${bond.id}_${i}`}
            x1={from.x + perpX * off} y1={from.y + perpY * off}
            x2={to.x + perpX * off} y2={to.y + perpY * off}
            stroke={strokeColor} strokeWidth={isImplicit ? 1.5 : 2.5} strokeLinecap="round" opacity={opacity}
            className={tool === 'delete' ? 'cursor-pointer hover:opacity-100' : ''}
            onClick={(e) => { e.stopPropagation(); if (tool === 'delete') onBondClick(bond.id); }}
          />
        ))}
      </g>
    );
  };

  const renderAtom = (atom: Atom, isImplicit = false) => {
    const isH = atom.symbol === 'H';
    const radius = isH ? 14 : 22;
    const isActive = atom.id === activeAtomId;
    const opacity = isImplicit ? 0.35 : 1;
    const remaining = isImplicit ? 0 : getRemainingValence(atom.id, atoms, bonds);

    return (
      <g key={atom.id}
        onMouseDown={(e) => !isImplicit && handleAtomMouseDown(atom.id, e)}
        style={{ cursor: tool === 'move' ? (dragging === atom.id ? 'grabbing' : 'grab') : tool === 'delete' ? 'pointer' : 'pointer', opacity }}
      >
        {/* Active ring */}
        {isActive && !isImplicit && (
          <circle cx={atom.x} cy={atom.y} r={radius + 12}
            fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeDasharray="4 3" opacity="0.7"
          >
            <animateTransform attributeName="transform" type="rotate"
              from={`0 ${atom.x} ${atom.y}`} to={`360 ${atom.x} ${atom.y}`} dur="4s" repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Glow */}
        <circle cx={atom.x} cy={atom.y} r={radius + 5}
          fill={atom.color} opacity={isActive ? 0.25 : 0.08}
        />

        {/* Main */}
        <circle cx={atom.x} cy={atom.y} r={radius}
          fill={atom.color}
          stroke={isActive ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.12)'}
          strokeWidth={isActive ? 3 : 1}
        />

        {/* Valence dots */}
        {!isImplicit && !isH && remaining > 0 && (
          <>
            {Array.from({ length: remaining }).map((_, i) => {
              const angle = ((-90 + i * (360 / Math.max(remaining, 1))) * Math.PI) / 180;
              const dotR = radius + 8;
              return (
                <circle key={`val_${atom.id}_${i}`}
                  cx={atom.x + dotR * Math.cos(angle)} cy={atom.y + dotR * Math.sin(angle)}
                  r={2} fill="hsl(var(--primary))" opacity="0.4"
                />
              );
            })}
          </>
        )}

        {/* Label */}
        <text x={atom.x} y={atom.y} textAnchor="middle" dominantBaseline="central"
          fill="white" fontSize={isH ? 10 : 13} fontWeight="bold"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', pointerEvents: 'none' }}
        >
          {atom.symbol}
        </text>
      </g>
    );
  };

  return (
    <svg ref={svgRef}
      className="w-full h-full min-h-[400px] rounded-2xl border border-border/30 bg-background/30 backdrop-blur-sm"
      style={{ cursor: cursorStyle }}
      onClick={handleCanvasClick} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
    >
      {/* Grid */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="0.7" fill="hsl(var(--muted-foreground) / 0.2)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />

      {/* Candidate position hints */}
      {tool === 'add' && candidateHints.map((c, i) => (
        <g key={`hint_${i}`} style={{ pointerEvents: 'none' }}>
          <line
            x1={activeAtom!.x} y1={activeAtom!.y} x2={c.x} y2={c.y}
            stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 6" opacity="0.15"
          />
          <circle cx={c.x} cy={c.y} r={8}
            fill="hsl(var(--primary))" opacity="0.08"
            stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="3 3"
          />
        </g>
      ))}

      {/* Ghost bond line */}
      {ghostPos && activeAtom && tool === 'add' && (
        <line x1={activeAtom.x} y1={activeAtom.y} x2={ghostPos.x} y2={ghostPos.y}
          stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6 4" opacity="0.4"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Ghost bond to existing atom */}
      {ghostOverAtom && activeAtom && ghostOverAtom.id !== activeAtomId && tool === 'add' && (
        <line x1={activeAtom.x} y1={activeAtom.y} x2={ghostOverAtom.x} y2={ghostOverAtom.y}
          stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6 4" opacity="0.5"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Bonds */}
      {bonds.map(b => renderBond(b, false))}
      {showHydrogens && implicitH.hydrogenBonds.map(b => renderBond(b, true))}

      {/* Ghost atom */}
      {ghostPos && !ghostOverAtom && tool === 'add' && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={ghostPos.x} cy={ghostPos.y}
            r={selectedAtomType === 'H' ? 14 : 22}
            fill={ATOM_COLORS[selectedAtomType] || '#888'} opacity="0.3"
          />
          <text x={ghostPos.x} y={ghostPos.y} textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="12" fontWeight="bold" opacity="0.4"
          >
            {selectedAtomType}
          </text>
        </g>
      )}

      {/* Atoms */}
      {showHydrogens && implicitH.hydrogenAtoms.map(a => renderAtom(a, true))}
      {atoms.map(a => renderAtom(a, false))}

      {/* Empty state */}
      {atoms.length === 0 && (
        <g>
          <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central" fill="hsl(var(--muted-foreground))" fontSize="16" fontFamily="'Space Grotesk', sans-serif">
            Clique aqui para começar a construir
          </text>
          <text x="50%" y="52%" textAnchor="middle" dominantBaseline="central" fill="hsl(var(--muted-foreground) / 0.6)" fontSize="13">
            Selecione um átomo e vá clicando para expandir
          </text>
        </g>
      )}
    </svg>
  );
}
