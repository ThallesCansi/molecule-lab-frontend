import React, { useRef, useState, useCallback } from 'react';
import { Atom } from '@/context/ExperienceContext';
import { BondWithOrder, getRemainingValence } from '@/lib/moleculeEngine';
import { ATOM_COLORS } from '@/data/presetMolecules';

interface BuilderCanvasProps {
  atoms: Atom[];
  bonds: BondWithOrder[];
  activeAtomId: string | null;
  selectedAtomType: string;
  showHydrogens: boolean;
  implicitH: { hydrogenAtoms: Atom[]; hydrogenBonds: BondWithOrder[] };
  tool: 'add' | 'move' | 'delete';
  onCanvasClick: (x: number, y: number) => void;
  onAtomClick: (atomId: string) => void;
  onAtomDelete: (atomId: string) => void;
  onBondClick: (bondId: string) => void;
  onAtomMove: (atomId: string, x: number, y: number) => void;
  onMoveEnd: () => void;
  getGhostPosition: (pos: { x: number; y: number }) => { x: number; y: number };
  findAtomAt: (pos: { x: number; y: number }) => Atom | null;
}

export default function BuilderCanvas({
  atoms,
  bonds,
  activeAtomId,
  selectedAtomType,
  showHydrogens,
  implicitH,
  tool,
  onCanvasClick,
  onAtomClick,
  onAtomDelete,
  onBondClick,
  onAtomMove,
  onMoveEnd,
  getGhostPosition,
  findAtomAt,
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
    if (tool === 'add') {
      // Check if clicking on existing atom
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
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setMousePos(pos);
    if (dragging) {
      onAtomMove(dragging, pos.x, pos.y);
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(null);
      onMoveEnd();
    }
  };

  // Compute ghost position
  const ghostPos = (tool === 'add' && mousePos && activeAtomId)
    ? getGhostPosition(mousePos)
    : null;

  // Check if ghost is over an existing atom
  const ghostOverAtom = mousePos ? findAtomAt(mousePos) : null;

  const activeAtom = activeAtomId ? atoms.find(a => a.id === activeAtomId) : null;

  // All display atoms/bonds
  const displayAtoms = showHydrogens ? [...atoms, ...implicitH.hydrogenAtoms] : atoms;
  const displayBonds = showHydrogens ? [...bonds, ...implicitH.hydrogenBonds] : bonds;

  const renderBond = (bond: BondWithOrder, isImplicit = false) => {
    const from = displayAtoms.find(a => a.id === bond.from);
    const to = displayAtoms.find(a => a.id === bond.to);
    if (!from || !to) return null;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const opacity = isImplicit ? 0.3 : 0.8;
    const strokeColor = isImplicit ? 'hsl(270, 10%, 35%)' : 'hsl(270, 15%, 55%)';

    if (bond.order === 1) {
      return (
        <line
          key={bond.id}
          x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke={strokeColor}
          strokeWidth={isImplicit ? 2 : 3}
          strokeLinecap="round"
          opacity={opacity}
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); if (tool === 'delete') onBondClick(bond.id); }}
        />
      );
    }

    const gap = bond.order === 2 ? 4 : 5;
    const lines = [];
    const offsets = bond.order === 2 ? [-gap, gap] : [-gap, 0, gap];

    for (let i = 0; i < offsets.length; i++) {
      const off = offsets[i];
      lines.push(
        <line
          key={`${bond.id}_${i}`}
          x1={from.x + perpX * off} y1={from.y + perpY * off}
          x2={to.x + perpX * off} y2={to.y + perpY * off}
          stroke={strokeColor}
          strokeWidth={isImplicit ? 1.5 : 2.5}
          strokeLinecap="round"
          opacity={opacity}
          className="cursor-pointer"
          onClick={(e) => { e.stopPropagation(); if (tool === 'delete') onBondClick(bond.id); }}
        />
      );
    }
    return <g key={bond.id}>{lines}</g>;
  };

  const renderAtom = (atom: Atom, isImplicit = false) => {
    const isH = atom.symbol === 'H';
    const radius = isH ? 14 : 22;
    const isActive = atom.id === activeAtomId;
    const opacity = isImplicit ? 0.4 : 1;
    const remaining = isImplicit ? 0 : getRemainingValence(atom.id, atoms, bonds);

    return (
      <g
        key={atom.id}
        onMouseDown={(e) => !isImplicit && handleAtomMouseDown(atom.id, e)}
        style={{
          cursor: tool === 'move' ? 'grab' : tool === 'delete' ? 'pointer' : 'pointer',
          opacity,
        }}
      >
        {/* Active ring */}
        {isActive && !isImplicit && (
          <circle
            cx={atom.x} cy={atom.y} r={radius + 12}
            fill="none"
            stroke="hsl(320, 70%, 55%)"
            strokeWidth="2"
            strokeDasharray="4 3"
            opacity="0.7"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${atom.x} ${atom.y}`}
              to={`360 ${atom.x} ${atom.y}`}
              dur="4s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Glow */}
        <circle
          cx={atom.x} cy={atom.y} r={radius + 6}
          fill={atom.color}
          opacity={isActive ? 0.25 : 0.1}
        />

        {/* Main circle */}
        <circle
          cx={atom.x} cy={atom.y} r={radius}
          fill={atom.color}
          stroke={isActive ? 'hsl(320, 70%, 55%)' : 'rgba(255,255,255,0.15)'}
          strokeWidth={isActive ? 2.5 : 1}
        />

        {/* Valence indicator dots */}
        {!isImplicit && !isH && remaining > 0 && (
          <>
            {Array.from({ length: remaining }).map((_, i) => {
              const angle = ((-90 + i * (360 / Math.max(remaining, 1))) * Math.PI) / 180;
              const dotR = radius + 8;
              return (
                <circle
                  key={`val_${atom.id}_${i}`}
                  cx={atom.x + dotR * Math.cos(angle)}
                  cy={atom.y + dotR * Math.sin(angle)}
                  r={2.5}
                  fill="hsl(280, 70%, 65%)"
                  opacity="0.5"
                />
              );
            })}
          </>
        )}

        {/* Label */}
        <text
          x={atom.x} y={atom.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={isH ? 11 : 13}
          fontWeight="bold"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)', pointerEvents: 'none' }}
        >
          {atom.symbol}
        </text>
      </g>
    );
  };

  return (
    <svg
      ref={svgRef}
      className="w-full h-full min-h-[400px] rounded-2xl border border-border/30 bg-background/30 backdrop-blur-sm"
      style={{ cursor: tool === 'add' ? 'crosshair' : tool === 'move' ? 'grab' : 'default' }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid dots */}
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="0.8" fill="hsl(270, 10%, 20%)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />

      {/* Ghost bond line */}
      {ghostPos && activeAtom && !ghostOverAtom && tool === 'add' && (
        <line
          x1={activeAtom.x} y1={activeAtom.y}
          x2={ghostPos.x} y2={ghostPos.y}
          stroke="hsl(280, 70%, 55%)"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.4"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Ghost bond to existing atom */}
      {ghostOverAtom && activeAtom && ghostOverAtom.id !== activeAtomId && tool === 'add' && (
        <line
          x1={activeAtom.x} y1={activeAtom.y}
          x2={ghostOverAtom.x} y2={ghostOverAtom.y}
          stroke="hsl(320, 70%, 55%)"
          strokeWidth="2"
          strokeDasharray="6 4"
          opacity="0.5"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Bonds */}
      {bonds.map(b => renderBond(b, false))}
      {showHydrogens && implicitH.hydrogenBonds.map(b => renderBond(b, true))}

      {/* Ghost atom */}
      {ghostPos && !ghostOverAtom && tool === 'add' && (
        <g style={{ pointerEvents: 'none' }}>
          <circle
            cx={ghostPos.x} cy={ghostPos.y}
            r={selectedAtomType === 'H' ? 14 : 22}
            fill={ATOM_COLORS[selectedAtomType] || '#888'}
            opacity="0.3"
          />
          <text
            x={ghostPos.x} y={ghostPos.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize="12"
            fontWeight="bold"
            opacity="0.4"
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
          <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central" fill="hsl(270, 10%, 35%)" fontSize="16" fontFamily="'Space Grotesk', sans-serif">
            Clique aqui para começar a construir
          </text>
          <text x="50%" y="52%" textAnchor="middle" dominantBaseline="central" fill="hsl(270, 10%, 28%)" fontSize="13">
            Selecione um átomo e vá clicando para expandir
          </text>
        </g>
      )}
    </svg>
  );
}
