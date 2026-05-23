/** @format */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useExperience, Atom } from "@/context/ExperienceContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw } from "lucide-react";

function fitMolecule(
  atoms: Atom[],
  viewW: number,
  viewH: number,
  padding = 60
) {
  if (atoms.length === 0) {
    return {
      atoms,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const atom of atoms) {
    minX = Math.min(minX, atom.x - 30);
    minY = Math.min(minY, atom.y - 30);
    maxX = Math.max(maxX, atom.x + 30);
    maxY = Math.max(maxY, atom.y + 30);
  }

  const width = maxX - minX;
  const height = maxY - minY;

  const scale = Math.min(
    1.5,
    (viewW - padding * 2) / Math.max(width, 1),
    (viewH - padding * 2) / Math.max(height, 1)
  );

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const fittedAtoms = atoms.map((atom) => ({
    ...atom,
    x: (atom.x - centerX) * scale + viewW / 2,
    y: (atom.y - centerY) * scale + viewH / 2,
  }));

  return {
    atoms: fittedAtoms,
    scale,
    offsetX: viewW / 2,
    offsetY: viewH / 2,
  };
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
  maxLife: number;
}

export default function SimulationScreen() {
  const {
    molecule,
    admin,
    setSimulationResult,
    setScreen,
    simulationResult,
    moleculeAnalysis,
  } = useExperience();

  const [phase, setPhase] = useState<"heating" | "result">("heating");
  const [progress, setProgress] = useState(0);
  const [temperature, setTemperature] = useState(25);
  const [bondPulse, setBondPulse] = useState(0);

  const [atomOffsets, setAtomOffsets] = useState<
    Record<string, { dx: number; dy: number }>
  >({});

  const [particles, setParticles] = useState<Particle[]>([]);

  const svgRef = useRef<SVGSVGElement>(null);
  const animFrameRef = useRef<number>(0);

  const SVG_W = 900;
  const SVG_H = 700;

  const { atoms: fittedAtoms } = useMemo(
    () => fitMolecule(molecule.atoms, SVG_W, SVG_H),
    [molecule.atoms]
  );

  const fittedBonds = molecule.bonds;

  const durations = {
    short: 4000,
    medium: 7000,
    long: 10000,
  };

  const totalDuration = durations[admin.animationDuration];

  useEffect(() => {
    let result: "stable" | "break";

    if (admin.forceResult === "stable") {
      result = "stable";
    } else if (admin.forceResult === "break") {
      result = "break";
    } else if (moleculeAnalysis?.result) {
      result = moleculeAnalysis.result;
    } else {
      const ratio = molecule.bonds.length / Math.max(molecule.atoms.length, 1);

      result = ratio >= 0.8 ? "stable" : "break";
    }

    setSimulationResult(result);
  }, [molecule, admin.forceResult, moleculeAnalysis, setSimulationResult]);

  const breakProgressTarget =
    moleculeAnalysis?.break_temperature != null
      ? Math.max(0.05, moleculeAnalysis.break_temperature / 10000)
      : 1;

  const effectiveDuration = totalDuration * breakProgressTarget;

  useEffect(() => {
    const start = Date.now();

    let running = true;

    const tick = () => {
      if (!running) return;

      const elapsed = Date.now() - start;

      const p = Math.min(elapsed / effectiveDuration, 1);

      setProgress(p);

      const maxT = moleculeAnalysis?.break_temperature ?? 10000;

      setTemperature(Math.round(1 + p * (maxT - 1)));

      setBondPulse(Math.sin(elapsed * 0.008) * 0.5 + 0.5);

      const intensity = p * admin.simulationIntensity * 3;

      const offsets: Record<string, { dx: number; dy: number }> = {};

      fittedAtoms.forEach((atom, i) => {
        const localPhase = elapsed * 0.01 + i * 1.5;

        offsets[atom.id] = {
          dx:
            Math.sin(localPhase * 1.3) * intensity +
            (Math.random() - 0.5) * intensity * 0.5,

          dy:
            Math.cos(localPhase * 0.9) * intensity +
            (Math.random() - 0.5) * intensity * 0.5,
        };
      });

      setAtomOffsets(offsets);

      if (p > 0.2 && Math.random() < p * 0.3) {
        const sourceAtom =
          fittedAtoms[Math.floor(Math.random() * fittedAtoms.length)];

        if (sourceAtom) {
          const angle = Math.random() * Math.PI * 2;

          const speed = 0.5 + Math.random() * 2;

          setParticles((prev) => [
            ...prev.slice(-50),
            {
              x: sourceAtom.x,
              y: sourceAtom.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              r: 1 + Math.random() * 3,
              color:
                p > 0.6
                  ? `hsl(${Math.random() * 40 + 10}, 90%, ${
                      55 + Math.random() * 20
                    }%)`
                  : `hsl(${280 + Math.random() * 40}, 70%, ${
                      55 + Math.random() * 20
                    }%)`,
              life: 0,
              maxLife: 30 + Math.random() * 40,
            },
          ]);
        }
      }

      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy - 0.02,
            life: particle.life + 1,
          }))
          .filter((particle) => particle.life < particle.maxLife)
      );

      if (p >= 1) {
        if (simulationResult === "break") {
          const burst: Particle[] = [];

          for (let i = 0; i < 60; i++) {
            const source =
              fittedAtoms[Math.floor(Math.random() * fittedAtoms.length)];

            if (!source) continue;

            const angle = Math.random() * Math.PI * 2;

            const speed = 2 + Math.random() * 6;

            burst.push({
              x: source.x,
              y: source.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              r: 2 + Math.random() * 5,
              color: `hsl(${Math.random() * 50 + 10}, 90%, ${
                50 + Math.random() * 30
              }%)`,
              life: 0,
              maxLife: 40 + Math.random() * 30,
            });
          }

          setParticles(burst);
        }

        setTimeout(() => {
          setPhase("result");
        }, 600);

        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    totalDuration,
    effectiveDuration,
    fittedAtoms,
    admin.simulationIntensity,
    simulationResult,
    moleculeAnalysis,
  ]);

  useEffect(() => {
    if (phase !== "result") return;

    let running = true;

    const tick = () => {
      if (!running) return;

      setParticles((prev) =>
        prev
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.05,
            life: particle.life + 1,
          }))
          .filter((particle) => particle.life < particle.maxLife)
      );

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);

    return () => {
      running = false;
    };
  }, [phase]);

  const isBreak = simulationResult === "break";

  const tempColor =
    progress < 0.3
      ? "hsl(280, 70%, 55%)"
      : progress < 0.7
      ? "hsl(30, 90%, 55%)"
      : "hsl(0, 80%, 55%)";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Heat overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at center, hsla(${
            350 - progress * 40
          }, 80%, 50%, ${progress * 0.18}) 0%, transparent 70%)`,
        }}
      />

      {/* Layout */}
      <div className="relative z-10 h-screen flex flex-col lg:flex-row p-20">
        {/* LEFT SIDE */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-10">
          <div className="w-full max-w-5xl">
            {/* Temperature */}
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground mb-3">
                Temperatura
              </p>

              <h1
                className="font-display text-5xl md:text-7xl font-bold transition-colors duration-300"
                style={{ color: tempColor }}
              >
                {temperature.toLocaleString("pt-BR")} K
              </h1>
            </div>

            {/* SVG */}
            <div className="relative rounded-3xl border border-border/30 bg-card/40 backdrop-blur-xl overflow-hidden">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full h-auto"
                ref={svgRef}
              >
                <defs>
                  <radialGradient id="heatGlow">
                    <stop
                      offset="0%"
                      stopColor={`hsla(${350 - progress * 30}, 80%, 50%, ${
                        progress * 0.25
                      })`}
                    />

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

                <circle
                  cx={SVG_W / 2}
                  cy={SVG_H / 2}
                  r={260}
                  fill="url(#heatGlow)"
                />

                {/* Particles */}
                {particles.map((particle, i) => (
                  <circle
                    key={i}
                    cx={particle.x}
                    cy={particle.y}
                    r={particle.r * (1 - particle.life / particle.maxLife)}
                    fill={particle.color}
                    opacity={0.8 * (1 - particle.life / particle.maxLife)}
                  />
                ))}

                {/* Bonds */}
                {fittedBonds.map((bond) => {
                  const from = fittedAtoms.find((a) => a.id === bond.from);

                  const to = fittedAtoms.find((a) => a.id === bond.to);

                  if (!from || !to) return null;

                  const offFrom = atomOffsets[bond.from] || {
                    dx: 0,
                    dy: 0,
                  };

                  const offTo = atomOffsets[bond.to] || {
                    dx: 0,
                    dy: 0,
                  };

                  const broken = phase === "result" && isBreak;

                  const pulseWidth = 3 + bondPulse * progress * 2;

                  const heatHue =
                    progress > 0.5 ? 30 + (1 - progress) * 30 : 270;

                  const bondColor =
                    progress > 0.3
                      ? `hsl(${heatHue}, ${60 + progress * 30}%, ${
                          45 + bondPulse * 10
                        }%)`
                      : "hsl(270, 10%, 50%)";

                  return (
                    <line
                      key={bond.id}
                      x1={from.x + offFrom.dx}
                      y1={from.y + offFrom.dy}
                      x2={to.x + offTo.dx}
                      y2={to.y + offTo.dy}
                      stroke={bondColor}
                      strokeWidth={broken ? 0 : pulseWidth}
                      strokeLinecap="round"
                      style={{
                        transition: broken
                          ? "stroke-width 0.6s ease-out"
                          : undefined,
                      }}
                    />
                  );
                })}

                {/* Atoms */}
                {fittedAtoms.map((atom, i) => {
                  const radius = atom.symbol === "H" ? 16 : 22;

                  const off = atomOffsets[atom.id] || {
                    dx: 0,
                    dy: 0,
                  };

                  const broken = phase === "result" && isBreak;

                  const burstAngle = (i / fittedAtoms.length) * Math.PI * 2;

                  const burstDist = broken ? 120 + Math.random() * 50 : 0;

                  const glowRadius = radius + 6 + progress * 14;

                  const glowOpacity = 0.1 + progress * 0.25;

                  return (
                    <g
                      key={atom.id}
                      style={{
                        transform: broken
                          ? `translate(${Math.cos(burstAngle) * burstDist}px, ${
                              Math.sin(burstAngle) * burstDist
                            }px)`
                          : undefined,

                        transition: "transform 1s ease-out, opacity 0.8s",

                        opacity: broken ? 0.3 : 1,
                      }}
                    >
                      <circle
                        cx={atom.x + off.dx}
                        cy={atom.y + off.dy}
                        r={glowRadius}
                        fill={
                          progress > 0.5
                            ? `hsla(30, 80%, 50%, ${glowOpacity})`
                            : atom.color
                        }
                        opacity={glowOpacity}
                      />

                      {progress > 0.4 && (
                        <circle
                          cx={atom.x + off.dx}
                          cy={atom.y + off.dy}
                          r={radius + 3 + bondPulse * 4}
                          fill="none"
                          stroke={`hsla(${40 - progress * 30}, 90%, 60%, ${
                            progress * 0.4
                          })`}
                          strokeWidth="1.5"
                        />
                      )}

                      <circle
                        cx={atom.x + off.dx}
                        cy={atom.y + off.dy}
                        r={radius}
                        fill={atom.color}
                        stroke={`hsla(${40 - progress * 40}, 80%, 55%, ${
                          progress * 0.7
                        })`}
                        strokeWidth={1.5 + progress * 2.5}
                        filter={progress > 0.6 ? "url(#atomGlow)" : undefined}
                      />

                      <text
                        x={atom.x + off.dx}
                        y={atom.y + off.dy}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontSize="14"
                        fontWeight="bold"
                        style={{
                          textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                          pointerEvents: "none",
                        }}
                      >
                        {atom.symbol}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full lg:w-[420px] xl:w-[520px] border-l border-border/20 bg-card/30 backdrop-blur-2xl flex flex-col justify-between p-6 lg:p-10">
          {/* Progress */}
          <div>
            <div className="mb-8">
              <div className="h-3 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${progress * 100}%`,
                    background:
                      "linear-gradient(90deg, hsl(280,70%,55%), hsl(30,80%,55%), hsl(0,80%,50%))",
                  }}
                />
              </div>

              <p className="text-sm text-muted-foreground mt-3">
                {progress < 0.3 && "Aquecendo suavemente..."}

                {progress >= 0.3 &&
                  progress < 0.7 &&
                  "⚡ Mais energia, mais vibração..."}

                {progress >= 0.7 && "🔥 Temperatura crítica!"}
              </p>
            </div>

            {/* Result */}
            {phase === "result" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <div className="text-6xl mb-4">{isBreak ? "💥" : "✨"}</div>

                  <h2 className="font-display text-4xl font-bold leading-tight">
                    {isBreak ? admin.breakMessage : admin.stableMessage}
                  </h2>

                  <p className="text-muted-foreground mt-4 leading-relaxed">
                    {isBreak
                      ? "Mais energia, mais vibração — maior chance de ruptura."
                      : "As ligações dessa molécula suportaram o aumento de energia térmica."}
                  </p>
                </div>

                {moleculeAnalysis && moleculeAnalysis.valid && (
                  <div className="rounded-2xl border border-border/30 bg-background/40 p-5 space-y-4">
                    {moleculeAnalysis.name && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                          Molécula
                        </p>

                        <p className="font-semibold text-lg">
                          {moleculeAnalysis.name}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {moleculeAnalysis.formula && (
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">
                            Fórmula
                          </p>

                          <p className="font-medium">
                            {moleculeAnalysis.formula}
                          </p>
                        </div>
                      )}

                      {moleculeAnalysis.molecular_weight > 0 && (
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">
                            Massa
                          </p>

                          <p className="font-medium">
                            {moleculeAnalysis.molecular_weight.toFixed(2)} g/mol
                          </p>
                        </div>
                      )}
                    </div>

                    {moleculeAnalysis.break_temperature != null && (
                      <div className="pt-4 border-t border-border/30">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                          Temperatura de quebra
                        </p>

                        <p className="text-2xl font-bold text-destructive">
                          {Math.round(
                            moleculeAnalysis.break_temperature
                          ).toLocaleString("pt-BR")}{" "}
                          K
                        </p>
                      </div>
                    )}

                    {moleculeAnalysis.smiles && (
                      <div className="pt-4 border-t border-border/30">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                          SMILES
                        </p>

                        <p className="font-mono text-xs break-all leading-relaxed">
                          {moleculeAnalysis.smiles}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          {phase === "result" && (
            <div className="flex flex-col gap-3 pt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setScreen("builder")}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Tentar outra
              </Button>

              <Button
                variant="hero"
                size="lg"
                onClick={() => setScreen("explanation")}
              >
                Entender por quê
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
