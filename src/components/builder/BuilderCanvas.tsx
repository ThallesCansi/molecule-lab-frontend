/** @format */

import React, {
  useRef,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Atom } from "@/context/ExperienceContext";
import {
  BondWithOrder,
  getRemainingValence,
  getCandidatePositions,
  BOND_LENGTH,
} from "@/lib/moleculeEngine";
import { ATOM_COLORS } from "@/data/presetMolecules";
import { Maximize2, ZoomIn, ZoomOut, Crosshair } from "lucide-react";

type Tool = "select" | "add" | "move" | "delete" | "pan";

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

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.15;

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
  onAtomSelect,
  onAtomDelete,
  onBondClick,
  onAtomMove,
  onMoveEnd,
  getGhostPosition,
  findAtomAt,
}: BuilderCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );

  // Pan & Zoom state
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);

  // Convert screen coords to world coords
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      const sx = screenX - rect.left;
      const sy = screenY - rect.top;
      return {
        x: (sx - pan.x) / zoom,
        y: (sy - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
      const scale = newZoom / zoom;

      setPan((p) => ({
        x: mx - scale * (mx - p.x),
        y: my - scale * (my - p.y),
      }));
      setZoom(newZoom);
    },
    [zoom]
  );

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Fit to content
  const fitToContent = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || atoms.length === 0) return;
    const allAtoms = showHydrogens
      ? [...atoms, ...implicitH.hydrogenAtoms]
      : atoms;
    const rect = svg.getBoundingClientRect();
    const padding = 80;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const a of allAtoms) {
      minX = Math.min(minX, a.x - 30);
      minY = Math.min(minY, a.y - 30);
      maxX = Math.max(maxX, a.x + 30);
      maxY = Math.max(maxY, a.y + 30);
    }

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const scaleX = (rect.width - padding * 2) / contentW;
    const scaleY = (rect.height - padding * 2) / contentH;
    const newZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Math.min(scaleX, scaleY))
    );

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setPan({
      x: rect.width / 2 - cx * newZoom,
      y: rect.height / 2 - cy * newZoom,
    });
    setZoom(newZoom);
  }, [atoms, showHydrogens, implicitH.hydrogenAtoms]);

  const centerView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg || atoms.length === 0) return;
    const rect = svg.getBoundingClientRect();
    let cx = 0,
      cy = 0;
    for (const a of atoms) {
      cx += a.x;
      cy += a.y;
    }
    cx /= atoms.length;
    cy /= atoms.length;
    setPan({
      x: rect.width / 2 - cx * zoom,
      y: rect.height / 2 - cy * zoom,
    });
  }, [atoms, zoom]);

  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const zoomIn = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const newZoom = Math.min(MAX_ZOOM, zoom + ZOOM_STEP);
    const scale = newZoom / zoom;
    setPan((p) => ({ x: mx - scale * (mx - p.x), y: my - scale * (my - p.y) }));
    setZoom(newZoom);
  }, [zoom]);

  const zoomOut = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = rect.width / 2;
    const my = rect.height / 2;
    const newZoom = Math.max(MIN_ZOOM, zoom - ZOOM_STEP);
    const scale = newZoom / zoom;
    setPan((p) => ({ x: mx - scale * (mx - p.x), y: my - scale * (my - p.y) }));
    setZoom(newZoom);
  }, [zoom]);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tool === "pan" || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      e.preventDefault();
      return;
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    if (dragging) return;
    const pos = screenToWorld(e.clientX, e.clientY);

    if (tool === "select") {
      const existing = findAtomAt(pos);
      if (existing) {
        onAtomSelect(existing.id === activeAtomId ? null : existing.id);
      } else {
        onAtomSelect(null);
      }
    } else if (tool === "add") {
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
    if (tool === "move") {
      setDragging(atomId);
    } else if (tool === "delete") {
      onAtomDelete(atomId);
    } else if (tool === "add") {
      onAtomClick(atomId);
    } else if (tool === "select") {
      onAtomSelect(atomId === activeAtomId ? null : atomId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && panStart.current) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
      return;
    }
    const pos = screenToWorld(e.clientX, e.clientY);
    setMousePos(pos);
    if (dragging) onAtomMove(dragging, pos.x, pos.y);
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      panStart.current = null;
      return;
    }
    if (dragging) {
      setDragging(null);
      onMoveEnd();
    }
  };

  // Touch support for pan/pinch
  const touchRef = useRef<{
    dist: number;
    cx: number;
    cy: number;
    zoom: number;
    pan: { x: number; y: number };
  } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0],
        t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      touchRef.current = { dist, cx, cy, zoom, pan: { ...pan } };
    } else if (e.touches.length === 1 && tool === "pan") {
      setIsPanning(true);
      panStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current) {
      e.preventDefault();
      const t1 = e.touches[0],
        t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const scale = dist / touchRef.current.dist;
      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, touchRef.current.zoom * scale)
      );
      const zoomRatio = newZoom / touchRef.current.zoom;
      const cx = (t1.clientX + t2.clientX) / 2;
      const cy = (t1.clientY + t2.clientY) / 2;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const mcx = touchRef.current.cx - rect.left;
      const mcy = touchRef.current.cy - rect.top;
      setPan({
        x:
          mcx -
          zoomRatio * (mcx - touchRef.current.pan.x) +
          (cx - touchRef.current.cx),
        y:
          mcy -
          zoomRatio * (mcy - touchRef.current.pan.y) +
          (cy - touchRef.current.cy),
      });
      setZoom(newZoom);
    } else if (e.touches.length === 1 && isPanning && panStart.current) {
      const dx = e.touches[0].clientX - panStart.current.x;
      const dy = e.touches[0].clientY - panStart.current.y;
      setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
    }
  };

  const handleTouchEnd = () => {
    touchRef.current = null;
    if (isPanning) {
      setIsPanning(false);
      panStart.current = null;
    }
  };

  const activeAtom = activeAtomId
    ? atoms.find((a) => a.id === activeAtomId)
    : null;
  const ghostOverAtom = mousePos ? findAtomAt(mousePos) : null;

  const ghostPos =
    tool === "add" && mousePos && activeAtom && !ghostOverAtom
      ? getGhostPosition(mousePos)
      : null;

  const candidateHints = useMemo(() => {
    if (tool !== "add" || !activeAtom) return [];
    const remaining = getRemainingValence(activeAtomId!, atoms, bonds);
    if (remaining <= 0) return [];
    return getCandidatePositions(
      activeAtom,
      atoms,
      bonds,
      Math.min(remaining, 4)
    );
  }, [tool, activeAtom, activeAtomId, atoms, bonds]);

  const cursorStyle =
    tool === "pan"
      ? isPanning
        ? "grabbing"
        : "grab"
      : tool === "add"
      ? "crosshair"
      : tool === "move"
      ? dragging
        ? "grabbing"
        : "grab"
      : tool === "select"
      ? "default"
      : "default";

  const renderBond = (bond: BondWithOrder, isImplicit = false) => {
    const allAtoms = showHydrogens
      ? [...atoms, ...implicitH.hydrogenAtoms]
      : atoms;
    const from = allAtoms.find((a) => a.id === bond.from);
    const to = allAtoms.find((a) => a.id === bond.to);
    if (!from || !to) return null;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const opacity = isImplicit ? 0.25 : 0.8;
    const strokeColor = isImplicit
      ? "hsl(var(--muted-foreground))"
      : "hsla(var(--foreground), 0.5)";

    if (bond.order === 1) {
      return (
        <line
          key={bond.id}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke={strokeColor}
          strokeWidth={isImplicit ? 1.5 : 3}
          strokeLinecap="round"
          opacity={opacity}
          className={
            tool === "delete" ? "cursor-pointer hover:opacity-100" : ""
          }
          onClick={(e) => {
            e.stopPropagation();
            if (tool === "delete") onBondClick(bond.id);
          }}
        />
      );
    }

    const gap = bond.order === 2 ? 4 : 5;
    const offsets = bond.order === 2 ? [-gap, gap] : [-gap, 0, gap];
    return (
      <g key={bond.id}>
        {offsets.map((off, i) => (
          <line
            key={`${bond.id}_${i}`}
            x1={from.x + perpX * off}
            y1={from.y + perpY * off}
            x2={to.x + perpX * off}
            y2={to.y + perpY * off}
            stroke={strokeColor}
            strokeWidth={isImplicit ? 1.5 : 2.5}
            strokeLinecap="round"
            opacity={opacity}
            className={
              tool === "delete" ? "cursor-pointer hover:opacity-100" : ""
            }
            onClick={(e) => {
              e.stopPropagation();
              if (tool === "delete") onBondClick(bond.id);
            }}
          />
        ))}
      </g>
    );
  };

  const renderAtom = (atom: Atom, isImplicit = false) => {
    const isH = atom.symbol === "H";
    const radius = isH ? 14 : 22;
    const isActive = atom.id === activeAtomId;
    const opacity = isImplicit ? 0.35 : 1;
    const remaining = isImplicit
      ? 0
      : getRemainingValence(atom.id, atoms, bonds);

    return (
      <g
        key={atom.id}
        onMouseDown={(e) => !isImplicit && handleAtomMouseDown(atom.id, e)}
        style={{
          cursor:
            tool === "move"
              ? dragging === atom.id
                ? "grabbing"
                : "grab"
              : tool === "delete"
              ? "pointer"
              : "pointer",
          opacity,
        }}
      >
        {isActive && !isImplicit && (
          <circle
            cx={atom.x}
            cy={atom.y}
            r={radius + 12}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
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
        <circle
          cx={atom.x}
          cy={atom.y}
          r={radius + 5}
          fill={atom.color}
          opacity={isActive ? 0.25 : 0.08}
        />
        <circle
          cx={atom.x}
          cy={atom.y}
          r={radius}
          fill={atom.color}
          stroke={isActive ? "hsl(var(--primary))" : "#20202090"}
          strokeWidth={isActive ? 3 : 1}
        />
        {!isImplicit && !isH && remaining > 0 && (
          <>
            {Array.from({ length: remaining }).map((_, i) => {
              const angle =
                ((-90 + i * (360 / Math.max(remaining, 1))) * Math.PI) / 180;
              const dotR = radius + 8;
              return (
                <circle
                  key={`val_${atom.id}_${i}`}
                  cx={atom.x + dotR * Math.cos(angle)}
                  cy={atom.y + dotR * Math.sin(angle)}
                  r={2}
                  fill="hsl(var(--primary))"
                  opacity="0.4"
                />
              );
            })}
          </>
        )}
        <text
          x={atom.x}
          y={atom.y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={isH ? 10 : 13}
          fontWeight="bold"
          style={{
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            pointerEvents: "none",
          }}
        >
          {atom.symbol}
        </text>
      </g>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full min-h-[400px] rounded-2xl border border-border/30 bg-background/30 backdrop-blur-sm"
        style={{ cursor: cursorStyle, touchAction: "none" }}
        onMouseDown={handleCanvasMouseDown}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Grid pattern in screen space */}
        <defs>
          <pattern
            id="grid"
            width={40 * zoom}
            height={40 * zoom}
            patternUnits="userSpaceOnUse"
            x={pan.x % (40 * zoom)}
            y={pan.y % (40 * zoom)}
          >
            <circle
              cx={20 * zoom}
              cy={20 * zoom}
              r={0.7 * zoom}
              fill="hsla(var(--muted-foreground), 0.2)"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.5" />

        {/* Transformed content */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Candidate position hints */}
          {tool === "add" &&
            candidateHints.map((c, i) => (
              <g key={`hint_${i}`} style={{ pointerEvents: "none" }}>
                <line
                  x1={activeAtom!.x}
                  y1={activeAtom!.y}
                  x2={c.x}
                  y2={c.y}
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                  opacity="0.15"
                />
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={8}
                  fill="hsl(var(--primary))"
                  opacity="0.08"
                  stroke="hsl(var(--primary))"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </g>
            ))}

          {/* Ghost bond line */}
          {ghostPos && activeAtom && tool === "add" && (
            <line
              x1={activeAtom.x}
              y1={activeAtom.y}
              x2={ghostPos.x}
              y2={ghostPos.y}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="6 4"
              opacity="0.4"
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* Ghost bond to existing atom */}
          {ghostOverAtom &&
            activeAtom &&
            ghostOverAtom.id !== activeAtomId &&
            tool === "add" && (
              <line
                x1={activeAtom.x}
                y1={activeAtom.y}
                x2={ghostOverAtom.x}
                y2={ghostOverAtom.y}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.5"
                style={{ pointerEvents: "none" }}
              />
            )}

          {/* Bonds */}
          {bonds.map((b) => renderBond(b, false))}
          {showHydrogens &&
            implicitH.hydrogenBonds.map((b) => renderBond(b, true))}

          {/* Ghost atom */}
          {ghostPos && !ghostOverAtom && tool === "add" && (
            <g style={{ pointerEvents: "none" }}>
              <circle
                cx={ghostPos.x}
                cy={ghostPos.y}
                r={selectedAtomType === "H" ? 14 : 22}
                fill={ATOM_COLORS[selectedAtomType] || "#888"}
                opacity="0.3"
              />
              <text
                x={ghostPos.x}
                y={ghostPos.y}
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
          {showHydrogens &&
            implicitH.hydrogenAtoms.map((a) => renderAtom(a, true))}
          {atoms.map((a) => renderAtom(a, false))}

          {/* Empty state */}
          {atoms.length === 0 && (
            <g>
              <text
                x="300"
                y="200"
                textAnchor="middle"
                dominantBaseline="central"
                fill="hsl(var(--muted-foreground))"
                fontSize="16"
                fontFamily="'Shadows Into Light', sans-serif"
              >
                Clique aqui para começar a construir
              </text>
              <text
                x="300"
                y="230"
                textAnchor="middle"
                dominantBaseline="central"
                fill="hsla(var(--muted-foreground), 0.6)"
                fontSize="13"
              >
                Selecione um átomo e vá clicando para expandir
              </text>
            </g>
          )}
        </g>
      </svg>

      {/* Zoom & nav controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-20">
        <button
          onClick={zoomIn}
          className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-all"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-all"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={centerView}
          className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-all"
          title="Centralizar"
        >
          <Crosshair className="w-4 h-4" />
        </button>
        <button
          onClick={fitToContent}
          className="p-2 rounded-xl glass-card text-muted-foreground hover:text-foreground transition-all"
          title="Ajustar à tela"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 left-3 text-xs text-muted-foreground/60 z-20">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
