/** @format */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useExperience, Atom } from "@/context/ExperienceContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw } from "lucide-react";
import {
  BrokenBond,
  MoleculeAnalysis,
  streamSimulationEvents,
} from "@/lib/moleculeApi";

// ─── Conversões ──────────────────────────────────────────────────────────────
const kelvinToCelsius = (k: number) => k - 273.15;

const formatTempC = (t: number) => {
  const rounded = Math.round(t);
  if (Math.abs(rounded) >= 10000) return `${(rounded / 1000).toFixed(0)}k°C`;
  if (Math.abs(rounded) >= 1000) return `${(rounded / 1000).toFixed(1)}k°C`;
  return `${rounded}°C`;
};

const getTemperatureContext = (tempC: number) => {
  if (tempC < -196)
    return { label: "Criogênico", trackColor: "#4fc3f7", dotColor: "#0277bd" };
  if (tempC < -73)
    return { label: "Frio Extremo", trackColor: "#81d4fa", dotColor: "#006064" };
  if (tempC < 0)
    return { label: "Congelante", trackColor: "#a5d6a7", dotColor: "#2e7d32" };
  if (tempC < 37)
    return { label: "Frio", trackColor: "#c8e6c9", dotColor: "#558b2f" };
  if (tempC < 100)
    return { label: "Moderado", trackColor: "#fff59d", dotColor: "#f57f17" };
  if (tempC < 427)
    return { label: "Quente", trackColor: "#ffcc02", dotColor: "#e65100" };
  if (tempC < 1227)
    return { label: "Extremo", trackColor: "#ff9800", dotColor: "#880e4f" };
  if (tempC < 3500)
    return { label: "Incandescente", trackColor: "#f44336", dotColor: "#4a148c" };
  return { label: "Estelar", trackColor: "#d32f2f", dotColor: "#311b92" };
};

const getBreakContext = (tempC: number): { icon: string; situation: string; sub: string } => {
  if (tempC < -196)
    return { icon: "🧊", situation: "No frio extremo do criogênio", sub: "Mais frio que nitrogênio líquido. As ligações vibraram perto do zero absoluto — e mesmo assim se romperam." };
  if (tempC < -73)
    return { icon: "❄️", situation: "Temperatura da Antártida", sub: "Frio extremo. A molécula não resistiu mesmo sem calor intenso." };
  if (tempC < 0)
    return { icon: "🌡️", situation: "Abaixo do congelamento", sub: "Temperatura de freezer. A energia de um ambiente frio foi suficiente para romper as ligações." };
  if (tempC < 37)
    return { icon: "☕", situation: "Temperatura ambiente", sub: "Ligações frágeis — uma energia modesta já as desfaz." };
  if (tempC < 100)
    return { icon: "🍳", situation: "Na temperatura de um café quente", sub: "Calor do dia a dia. A molécula se desmontou em temperatura doméstica." };
  if (tempC < 427)
    return { icon: "🌋", situation: "No calor da superfície de Vênus", sub: "Um ambiente inóspito. Temperatura de plásticos fundindo." };
  if (tempC < 1227)
    return { icon: "⚙️", situation: "No ponto de fusão do ferro", sub: "Temperatura industrial. A molécula resistiu até onde o ferro começa a derreter." };
  if (tempC < 3500)
    return { icon: "💫", situation: "Em temperatura de estrela de baixa massa", sub: "Mais quente que qualquer coisa na Terra. Uma resistência notável." };
  return { icon: "☀️", situation: "Na superfície do Sol", sub: "As ligações só se romperam em temperatura estelar. Uma molécula extraordinariamente estável." };
};

// ─── Escala logarítmica vertical ─────────────────────────────────────────────
const MILESTONES = [
  { value: -270, icon: "🌌", label: "Zero Absoluto", desc: "A menor temperatura possível" },
  { value: -196, icon: "🧊", label: "N₂ Líquido", desc: "Criogenia extrema" },
  { value: 0,    icon: "❄️", label: "Congelamento", desc: "Água vira gelo" },
  { value: 37,   icon: "🧬", label: "Corpo Humano", desc: "Temperatura biológica" },
  { value: 100,  icon: "♨️", label: "Ebulição", desc: "Água evapora" },
  { value: 460,  icon: "🌋", label: "Vênus", desc: "Planeta infernal" },
  { value: 1200, icon: "⚙️", label: "Ferro Fundindo", desc: "Temperatura industrial" },
  { value: 5500, icon: "☀️", label: "Superfície Solar", desc: "Temperatura estelar" },
];

function scaleTemp(temp: number): number {
  const min = -273;
  const max = 5500;
  const normalized = (temp - min) / (max - min);
  return (Math.log10(normalized * 9 + 1) / Math.log10(10)) * 100;
}

// ─── Barra de temperatura vertical ───────────────────────────────────────────
interface VerticalTempScaleProps {
  temperatureC: number;
  breakTempC: number | null;
  phase: "heating" | "result";
  isBreak: boolean;
}

function VerticalTempScale({ temperatureC, breakTempC, phase, isBreak }: VerticalTempScaleProps) {
  const ctx = getTemperatureContext(temperatureC);
  const [hovered, setHovered] = useState<number | null>(null);

  const currentPos = scaleTemp(temperatureC); // 0–100, onde 100 = top (mais quente)
  const breakPos = breakTempC != null ? scaleTemp(breakTempC) : null;

  // Converte posição lógica (0=frio, 100=quente) → posição CSS de top (0=quente, 100=frio)
  const toTopPct = (pos: number) => `${100 - pos}%`;

  return (
    <div className="relative flex flex-row gap-0 h-full" style={{ minHeight: 480 }}>
      {/* ─── Track ────────────────────────────────────────────── */}
      <div className="relative flex items-stretch" style={{ width: 56 }}>
        {/* Trilho de cor */}
        <div
          className="relative flex-1 rounded-full overflow-hidden border border-white/10 mx-auto"
          style={{
            width: 20,
            background: `linear-gradient(to top,
              #4fc3f7 0%,
              #81d4fa 10%,
              #c8e6c9 25%,
              #fff59d 45%,
              #ffcc02 60%,
              #ff9800 75%,
              #f44336 88%,
              #7c4dff 100%
            )`,
          }}
        >
          {/* Fill animado (progress) */}
          {/* <div
            className="absolute left-0 right-0 bottom-0 bg-black/30 transition-all duration-300"
            style={{ height: `${100 - currentPos}%` }}
          /> */}

          {/* Marcador de ruptura */}
          {breakPos != null && (
            <div
              className="absolute left-1/2 z-20"
              style={{ top: toTopPct(breakPos), transform: "translate(-50%, -50%)" }}
            >
              <div className="relative">
                <div className="absolute inset-0 bg-red-500 blur-sm opacity-70 scale-150 rounded-full animate-pulse" />
                <div className="w-4 h-4 rounded-full bg-red-500 border-4 border-white shadow-xl relative z-10" />
              </div>
            </div>
          )}

          {/* Indicador atual */}
          <div
            className="absolute left-1/2 z-30 transition-all duration-300"
            style={{ top: toTopPct(currentPos), transform: "translate(-50%, -50%)" }}
          >
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: ctx.trackColor, opacity: 0.35 }}
              />
              <div
                className="w-7 h-7 rounded-full border-4 bg-white shadow-2xl"
                style={{ borderColor: ctx.dotColor }}
              />
              <div
                className="absolute inset-0 m-auto w-3 h-3 rounded-full"
                style={{ background: ctx.dotColor }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Milestones ───────────────────────────────────────── */}
      <div className="relative flex-1" style={{ minWidth: 160 }}>
        {MILESTONES.map((m, idx) => {
          const pos = scaleTemp(m.value);
          const active = temperatureC >= m.value || hovered === idx;

          return (
            <div
              key={m.value}
              className="absolute flex items-center gap-2 cursor-pointer group"
              style={{
                top: toTopPct(pos),
                transform: "translateY(-50%)",
                left: 8,
                right: 0,
              }}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Linha conectora ao trilho */}
              <div
                className="absolute"
                style={{
                  left: -16,
                  width: 16,
                  height: 2,
                  background: active ? ctx.dotColor : "rgba(255,255,255,0.15)",
                  transition: "background 0.3s",
                }}
              />

              {/* Ícone */}
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-xl border backdrop-blur-xl transition-all duration-300"
                style={{
                  width: hovered === idx ? 38 : 32,
                  height: hovered === idx ? 38 : 32,
                  fontSize: hovered === idx ? 20 : 16,
                  background: active ? `${ctx.trackColor}33` : "rgba(255,255,255,0.06)",
                  borderColor: active ? `${ctx.trackColor}66` : "rgba(255,255,255,0.08)",
                  transform: hovered === idx ? "scale(1.1)" : "scale(1)",
                }}
              >
                {m.icon}
              </div>

              {/* Labels */}
              <div
                className="transition-all duration-200"
                style={{ opacity: active || hovered === idx ? 1 : 0.55 }}
              >
                <p
                  className="text-xs font-semibold leading-tight whitespace-nowrap"
                  style={{ color: active ? ctx.dotColor : undefined }}
                >
                  {m.label}
                </p>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatTempC(m.value)}
                </p>
              </div>

              {/* Tooltip */}
              {hovered === idx && (
                <div className="absolute left-full ml-2 z-50 pointer-events-none">
                  <div className="w-44 rounded-xl border border-white/10 bg-background/90 backdrop-blur-xl p-3 shadow-2xl">
                    <p className="font-semibold text-xs mb-1">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Fit molecule ─────────────────────────────────────────────────────────────
function fitMolecule(atoms: Atom[], viewW: number, viewH: number, padding = 60) {
  if (atoms.length === 0) return { atoms, scale: 1, offsetX: 0, offsetY: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const atom of atoms) {
    minX = Math.min(minX, atom.x - 30);
    minY = Math.min(minY, atom.y - 30);
    maxX = Math.max(maxX, atom.x + 30);
    maxY = Math.max(maxY, atom.y + 30);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  const scale = Math.min(1.5, (viewW - padding * 2) / Math.max(width, 1), (viewH - padding * 2) / Math.max(height, 1));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  return {
    atoms: atoms.map((atom) => ({
      ...atom,
      x: (atom.x - centerX) * scale + viewW / 2,
      y: (atom.y - centerY) * scale + viewH / 2,
    })),
    scale,
    offsetX: viewW / 2,
    offsetY: viewH / 2,
  };
}

interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; color: string; life: number; maxLife: number;
}

// ─── Tela Principal ───────────────────────────────────────────────────────────
export default function SimulationScreen() {
  const {
    molecule, admin, setSimulationResult, setMoleculeAnalysis,
    setScreen, simulationResult, moleculeAnalysis,
  } = useExperience();

  const [phase, setPhase] = useState<"heating" | "result">("heating");
  const [progress, setProgress] = useState(0);
  const [temperatureC, setTemperatureC] = useState(25);
  const [bondPulse, setBondPulse] = useState(0);
  const [streamStatus, setStreamStatus] = useState<"idle" | "connecting" | "running" | "complete" | "error">("idle");
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);
  const [candidateBrokenBonds, setCandidateBrokenBonds] = useState<BrokenBond[]>([]);
  const [atomOffsets, setAtomOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  const [particles, setParticles] = useState<Particle[]>([]);

  const svgRef = useRef<SVGSVGElement>(null);
  const animFrameRef = useRef<number>(0);
  const progressRef = useRef(0);
  const analysisRef = useRef<MoleculeAnalysis | null>(moleculeAnalysis);
  const forceResultRef = useRef(admin.forceResult);

  const SVG_W = 700;
  const SVG_H = 500;

  const { atoms: fittedAtoms } = useMemo(
    () => fitMolecule(molecule.atoms, SVG_W, SVG_H),
    [molecule.atoms]
  );
  const fittedBonds = molecule.bonds;

  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => { analysisRef.current = moleculeAnalysis; }, [moleculeAnalysis]);
  useEffect(() => { forceResultRef.current = admin.forceResult; }, [admin.forceResult]);

  useEffect(() => {
    if (admin.forceResult === "stable" || admin.forceResult === "break") {
      setSimulationResult(admin.forceResult);
      return;
    }
    setSimulationResult(moleculeAnalysis?.result ?? null);
  }, [admin.forceResult, moleculeAnalysis?.result, setSimulationResult]);

  useEffect(() => {
    if (!moleculeAnalysis?.events_url) {
      setStreamStatus("error");
      setScreen("api-error");
      return;
    }

    let cancelled = false;
    setPhase("heating");
    setProgress(0);
    setTemperatureC(25);
    setCacheMessage(null);
    setCandidateBrokenBonds([]);
    setStreamStatus("connecting");

    const stop = streamSimulationEvents(moleculeAnalysis.events_url, {
      onMetadata: () => { if (!cancelled) setStreamStatus("running"); },
      onProgress: (event) => {
        if (cancelled) return;
        setStreamStatus("running");
        setProgress(Math.max(0, Math.min(1, event.progress)));
        setTemperatureC(Math.round(kelvinToCelsius(event.target_temperature)));
        setCandidateBrokenBonds(event.candidate_broken_bonds ?? []);
      },
      onCacheHit: (event) => { if (!cancelled) setCacheMessage(event.message); },
      onResult: (event) => {
        if (cancelled) return;
        const forceResult = forceResultRef.current;
        const forcedResult = forceResult === "stable" || forceResult === "break" ? forceResult : event.result;
        const current = analysisRef.current;
        setSimulationResult(forcedResult);
        setProgress(1);
        const breakTempC = event.break_temperature ? Math.round(kelvinToCelsius(event.break_temperature)) : null;
        setTemperatureC(breakTempC ?? Math.round(kelvinToCelsius(event.target_temperatures[event.target_temperatures.length - 1] ?? 10000)));
        setCandidateBrokenBonds([]);
        setStreamStatus("complete");
        if (current) {
          setMoleculeAnalysis({
            ...current, result: forcedResult, break_step: event.break_step,
            break_temperature: event.break_temperature, broken_bonds: event.broken_bonds,
            temperatures: event.temperatures, target_temperatures: event.target_temperatures,
            elapsed_seconds: event.elapsed_seconds, cached: event.cached,
          });
        }
        window.setTimeout(() => { if (!cancelled) setPhase("result"); }, 600);
      },
      onError: (error) => {
        if (cancelled) return;
        console.error("[moleculeApi] streamSimulationEvents falhou:", error);
        setStreamStatus("error");
        setScreen("api-error");
      },
    });

    return () => { cancelled = true; stop(); };
  }, [moleculeAnalysis?.events_url, setMoleculeAnalysis, setScreen, setSimulationResult]);

  useEffect(() => {
    if (phase !== "heating") return;
    const start = performance.now();
    let running = true;
    const tick = () => {
      if (!running) return;
      const elapsed = performance.now() - start;
      const p = progressRef.current;
      setBondPulse(Math.sin(elapsed * 0.008) * 0.5 + 0.5);
      const intensity = p * admin.simulationIntensity * 3;
      const offsets: Record<string, { dx: number; dy: number }> = {};
      fittedAtoms.forEach((atom, i) => {
        const localPhase = elapsed * 0.01 + i * 1.5;
        offsets[atom.id] = {
          dx: Math.sin(localPhase * 1.3) * intensity + (Math.random() - 0.5) * intensity * 0.5,
          dy: Math.cos(localPhase * 0.9) * intensity + (Math.random() - 0.5) * intensity * 0.5,
        };
      });
      setAtomOffsets(offsets);
      if (p > 0.2 && Math.random() < p * 0.3) {
        const sourceAtom = fittedAtoms[Math.floor(Math.random() * fittedAtoms.length)];
        if (sourceAtom) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 2;
          setParticles((prev) => [
            ...prev.slice(-50),
            {
              x: sourceAtom.x, y: sourceAtom.y,
              vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
              r: 1 + Math.random() * 3,
              color: p > 0.6
                ? `hsl(${Math.random() * 40 + 10}, 90%, ${55 + Math.random() * 20}%)`
                : `hsl(${280 + Math.random() * 40}, 70%, ${55 + Math.random() * 20}%)`,
              life: 0, maxLife: 30 + Math.random() * 40,
            },
          ]);
        }
      }
      setParticles((prev) =>
        prev.map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy - 0.02, life: p.life + 1 }))
          .filter((p) => p.life < p.maxLife)
      );
      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [fittedAtoms, admin.simulationIntensity, phase]);

  useEffect(() => {
    if (phase !== "result") return;
    let running = true;
    const tick = () => {
      if (!running) return;
      setParticles((prev) =>
        prev.map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.05, life: p.life + 1 }))
          .filter((p) => p.life < p.maxLife)
      );
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return () => { running = false; };
  }, [phase]);

  const isBreak = simulationResult === "break";
  const breakTempC = moleculeAnalysis?.break_temperature
    ? Math.round(kelvinToCelsius(moleculeAnalysis.break_temperature))
    : null;

  useEffect(() => {
    if (phase !== "result" || !isBreak) return;
    const burst: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      const source = fittedAtoms[Math.floor(Math.random() * fittedAtoms.length)];
      if (!source) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      burst.push({
        x: source.x, y: source.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        r: 2 + Math.random() * 5,
        color: `hsl(${Math.random() * 50 + 10}, 90%, ${50 + Math.random() * 30}%)`,
        life: 0, maxLife: 40 + Math.random() * 30,
      });
    }
    setParticles(burst);
  }, [fittedAtoms, isBreak, phase]);

  const tempCtx = getTemperatureContext(temperatureC);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">

      {/* Heat overlay global */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000 z-0"
        style={{
          background: `radial-gradient(circle at 50% 60%, ${tempCtx.trackColor}${Math.round(progress * 0.15 * 255).toString(16).padStart(2, "0")} 0%, transparent 65%)`,
        }}
      />

      {/* ═══════════════════════════════════════════════════════
          TOPO: Temperatura + Status + Resultado
      ═══════════════════════════════════════════════════════ */}
      <header className="relative z-10 border-b border-border/20 bg-card/30 backdrop-blur-xl px-6 lg:px-10 py-5">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-0 justify-between">

          {/* Temperatura atual */}
          {/* <div className="flex items-center gap-4 min-w-0">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-0.5">
                Energia Térmica
              </p>
              <div className="flex items-baseline gap-3">
                <span
                  className="font-mono text-5xl font-bold tabular-nums leading-none transition-all duration-300"
                  style={{ color: tempCtx.dotColor }}
                >
                  {formatTempC(temperatureC)}
                </span>
                <span
                  className="px-3 py-1 rounded-full border text-xs font-semibold"
                  style={{
                    background: `${tempCtx.trackColor}22`,
                    borderColor: `${tempCtx.trackColor}55`,
                    color: tempCtx.dotColor,
                  }}
                >
                  {tempCtx.label}
                </span>
              </div>
            </div>
          </div> */}

          {/* Barra de progresso central */}
          <div className="flex-1 max-w-md mx-0 lg:mx-12">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-muted-foreground">
                {streamStatus === "connecting" && "Conectando ao simulador..."}
                {streamStatus === "running" && progress < 0.3 && "Aquecendo suavemente..."}
                {streamStatus === "running" && progress >= 0.3 && progress < 0.7 && "⚡ Mais energia, mais vibração..."}
                {streamStatus === "running" && progress >= 0.7 && "🔥 Temperatura crítica!"}
                {streamStatus === "complete" && "Resultado recebido."}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {Math.round(progress * 100)}%
              </p>
            </div>
            <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress * 100}%`,
                  background: `linear-gradient(90deg, #4fc3f7, ${tempCtx.trackColor}, ${tempCtx.dotColor})`,
                }}
              />
            </div>
            {(cacheMessage || candidateBrokenBonds.length > 0) && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {cacheMessage ?? `${candidateBrokenBonds.length} ligação(ões) sob tensão crítica`}
              </p>
            )}
          </div>

          {/* Informações da molécula */}
          {moleculeAnalysis && moleculeAnalysis.valid && (
            <div className="flex items-center gap-6 text-sm">
              {moleculeAnalysis.name && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Molécula</p>
                  <p className="font-semibold">{moleculeAnalysis.name}</p>
                </div>
              )}
              {moleculeAnalysis.formula && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fórmula</p>
                  <p className="font-semibold">{moleculeAnalysis.formula}</p>
                </div>
              )}
              {moleculeAnalysis.molecular_weight > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Massa</p>
                  <p className="font-semibold">{moleculeAnalysis.molecular_weight.toFixed(2)} g/mol</p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          ÁREA PRINCIPAL: Molécula + Escala vertical
      ═══════════════════════════════════════════════════════ */}
      <main className="relative z-10 flex-1 flex overflow-hidden">

        {/* ── Centro: SVG da molécula ── */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-10 min-w-0">

          {/* Resultado (aparece sobre a molécula) */}
          {phase === "result" && (
            <div className="w-full max-w-2xl mb-6 animate-in fade-in slide-in-from-top-3 duration-500">
              <div
                className="rounded-2xl border p-5 flex items-start gap-4"
                style={{
                  background: `${tempCtx.trackColor}18`,
                  borderColor: `${tempCtx.trackColor}44`,
                }}
              >
                <span className="text-4xl flex-shrink-0">{isBreak ? "💥" : "✨"}</span>
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-bold leading-tight">
                    {isBreak ? admin.breakMessage : admin.stableMessage}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    {isBreak
                      ? "Mais energia, mais vibração — maior chance de ruptura."
                      : "As ligações dessa molécula suportaram o aumento de energia térmica."}
                  </p>
                </div>
              </div>

              {/* Contexto de ruptura */}
              {isBreak && (
                <div className="mt-3 rounded-xl border border-border/20 bg-background/40 backdrop-blur p-4 flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{getBreakContext(temperatureC).icon}</span>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Ruptura molecular</p>
                    <p className="font-semibold text-base">{getBreakContext(temperatureC).situation}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{getBreakContext(temperatureC).sub}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SVG */}
          <div
            className="relative w-full max-w-2xl rounded-3xl border border-border/30 bg-card/40 backdrop-blur-xl overflow-hidden"
          >
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full h-auto"
              ref={svgRef}
            >
              <defs>
                <radialGradient id="heatGlow">
                  <stop offset="0%" stopColor={`${tempCtx.trackColor}${Math.round(progress * 0.25 * 255).toString(16).padStart(2, "0")}`} />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <filter id="atomGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx={SVG_W / 2} cy={SVG_H / 2} r={220} fill="url(#heatGlow)" />

              {particles.map((particle, i) => (
                <circle key={i}
                  cx={particle.x} cy={particle.y}
                  r={particle.r * (1 - particle.life / particle.maxLife)}
                  fill={particle.color}
                  opacity={0.8 * (1 - particle.life / particle.maxLife)}
                />
              ))}

              {fittedBonds.map((bond) => {
                const from = fittedAtoms.find((a) => a.id === bond.from);
                const to = fittedAtoms.find((a) => a.id === bond.to);
                if (!from || !to) return null;
                const offFrom = atomOffsets[bond.from] || { dx: 0, dy: 0 };
                const offTo = atomOffsets[bond.to] || { dx: 0, dy: 0 };
                const broken = phase === "result" && isBreak;
                const pulseWidth = 3 + bondPulse * progress * 2;
                const heatHue = progress > 0.5 ? 30 + (1 - progress) * 30 : 270;
                const bondColor = progress > 0.3
                  ? `hsl(${heatHue}, ${60 + progress * 30}%, ${45 + bondPulse * 10}%)`
                  : "hsl(270, 10%, 50%)";
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const len = Math.hypot(dx, dy) || 1;
                const perpX = -dy / len;
                const perpY = dx / len;
                const order = bond.order ?? 1;
                const gap = order === 2 ? 4 : 5;
                const offsets = order === 1 ? [0] : order === 2 ? [-gap, gap] : [-gap, 0, gap];
                return (
                  <g key={bond.id}>
                    {offsets.map((offset, i) => (
                      <line key={`${bond.id}_${i}`}
                        x1={from.x + offFrom.dx + perpX * offset}
                        y1={from.y + offFrom.dy + perpY * offset}
                        x2={to.x + offTo.dx + perpX * offset}
                        y2={to.y + offTo.dy + perpY * offset}
                        stroke={bondColor}
                        strokeWidth={broken ? 0 : order === 1 ? pulseWidth : Math.max(2, pulseWidth - 0.6)}
                        strokeLinecap="round"
                        style={{ transition: broken ? "stroke-width 0.6s ease-out" : undefined }}
                      />
                    ))}
                  </g>
                );
              })}

              {fittedAtoms.map((atom, i) => {
                const radius = atom.symbol === "H" ? 16 : 22;
                const off = atomOffsets[atom.id] || { dx: 0, dy: 0 };
                const broken = phase === "result" && isBreak;
                const burstAngle = (i / fittedAtoms.length) * Math.PI * 2;
                const burstDist = broken ? 120 : 0;
                const glowRadius = radius + 6 + progress * 14;
                const glowOpacity = 0.1 + progress * 0.25;
                return (
                  <g key={atom.id} style={{
                    transform: broken ? `translate(${Math.cos(burstAngle) * burstDist}px, ${Math.sin(burstAngle) * burstDist}px)` : undefined,
                    transition: "transform 1s ease-out, opacity 0.8s",
                    opacity: broken ? 0.3 : 1,
                  }}>
                    <circle cx={atom.x + off.dx} cy={atom.y + off.dy} r={glowRadius}
                      fill={progress > 0.5 ? `${tempCtx.trackColor}${Math.round(glowOpacity * 255).toString(16).padStart(2, "0")}` : atom.color}
                      opacity={glowOpacity} />
                    {progress > 0.4 && (
                      <circle cx={atom.x + off.dx} cy={atom.y + off.dy} r={radius + 3 + bondPulse * 4}
                        fill="none"
                        stroke={`${tempCtx.dotColor}${Math.round(progress * 0.4 * 255).toString(16).padStart(2, "0")}`}
                        strokeWidth="1.5" />
                    )}
                    <circle cx={atom.x + off.dx} cy={atom.y + off.dy} r={radius}
                      fill={atom.color}
                      stroke={`${tempCtx.dotColor}${Math.round(progress * 0.7 * 255).toString(16).padStart(2, "0")}`}
                      strokeWidth={1.5 + progress * 2.5}
                      filter={progress > 0.6 ? "url(#atomGlow)" : undefined} />
                    <text x={atom.x + off.dx} y={atom.y + off.dy}
                      textAnchor="middle" dominantBaseline="central"
                      fill="white" fontSize="14" fontWeight="bold"
                      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.6)", pointerEvents: "none" }}>
                      {atom.symbol}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Botões de ação */}
          {phase === "result" && (
            <div className="flex gap-3 mt-6 w-full max-w-2xl">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setScreen("builder")}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Tentar outra
              </Button>
              <Button variant="hero" size="lg" className="flex-1" onClick={() => setScreen("explanation")}>
                Entender por quê
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Direita: Escala vertical de temperatura ── */}
        <aside
          className="hidden lg:flex flex-col border-l border-border/20 bg-card/20 backdrop-blur-sm"
          style={{ width: 260, padding: "32px 20px 32px 24px" }}
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-5">
            Escala Térmica
          </p>
          <div className="flex-1">
            <VerticalTempScale
              temperatureC={temperatureC}
              breakTempC={breakTempC}
              phase={phase}
              isBreak={isBreak}
            />
          </div>
        </aside>
      </main>
    </div>
  );
}