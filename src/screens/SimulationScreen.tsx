/** @format */

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useExperience, Atom } from "@/context/ExperienceContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, RotateCcw } from "lucide-react";

// Fit molecule into the SVG viewport
function fitMolecule(
  atoms: Atom[],
  viewW: number,
  viewH: number,
  padding = 60
) {
  if (atoms.length === 0) return { atoms, scale: 1, offsetX: 0, offsetY: 0 };
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const a of atoms) {
    minX = Math.min(minX, a.x - 30);
    minY = Math.min(minY, a.y - 30);
    maxX = Math.max(maxX, a.x + 30);
    maxY = Math.max(maxY, a.y + 30);
  }
  const cw = maxX - minX;
  const ch = maxY - minY;
  const scale = Math.min(
    1.5,
    (viewW - padding * 2) / Math.max(cw, 1),
    (viewH - padding * 2) / Math.max(ch, 1)
  );
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const fitted = atoms.map((a) => ({
    ...a,
    x: (a.x - cx) * scale + viewW / 2,
    y: (a.y - cy) * scale + viewH / 2,
  }));
  return { atoms: fitted, scale, offsetX: viewW / 2, offsetY: viewH / 2 };
}

// Particle type for burst effect
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
  const { molecule, admin, setSimulationResult, setScreen, simulationResult } =
    useExperience();
  const [phase, setPhase] = useState<"heating" | "result">("heating");
  const [progress, setProgress] = useState(0);
  const [temperature, setTemperature] = useState(25);
  const svgRef = useRef<SVGSVGElement>(null);
  const animFrameRef = useRef<number>(0);

  // Vibration offsets
  const [atomOffsets, setAtomOffsets] = useState<
    Record<string, { dx: number; dy: number }>
  >({});
  // Bond pulse
  const [bondPulse, setBondPulse] = useState(0);
  // Particles
  const [particles, setParticles] = useState<Particle[]>([]);

  const SVG_W = 700;
  const SVG_H = 500;

  // Fit molecule
  const { atoms: fittedAtoms, scale: fitScale } = useMemo(
    () => fitMolecule(molecule.atoms, SVG_W, SVG_H),
    [molecule.atoms]
  );

  const fittedBonds = molecule.bonds;

  const durations = { short: 4000, medium: 7000, long: 10000 };
  const totalDuration = durations[admin.animationDuration];

  // Determine result
  useEffect(() => {
    let result: "stable" | "break";
    if (admin.forceResult === "stable") result = "stable";
    else if (admin.forceResult === "break") result = "break";
    else {
      const ratio = molecule.bonds.length / Math.max(molecule.atoms.length, 1);
      result = ratio >= 0.8 ? "stable" : "break";
    }
    setSimulationResult(result);
  }, [molecule, admin.forceResult, setSimulationResult]);

  // Main animation loop
  useEffect(() => {
    const start = Date.now();
    let running = true;

    const tick = () => {
      if (!running) return;
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / totalDuration, 1);
      setProgress(p);
      setTemperature(25 + p * 975);
      setBondPulse(Math.sin(elapsed * 0.008) * 0.5 + 0.5);

      // Vibration offsets with easing
      const intensity = p * admin.simulationIntensity * 3;
      const offsets: Record<string, { dx: number; dy: number }> = {};
      fittedAtoms.forEach((atom, i) => {
        const phase = elapsed * 0.01 + i * 1.5;
        offsets[atom.id] = {
          dx:
            Math.sin(phase * 1.3) * intensity +
            (Math.random() - 0.5) * intensity * 0.5,
          dy:
            Math.cos(phase * 0.9) * intensity +
            (Math.random() - 0.5) * intensity * 0.5,
        };
      });
      setAtomOffsets(offsets);

      // Spawn ambient particles during heating
      if (p > 0.2 && Math.random() < p * 0.3) {
        const sourceAtom =
          fittedAtoms[Math.floor(Math.random() * fittedAtoms.length)];
        if (sourceAtom) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 2;
          setParticles((prev) => [
            ...prev.slice(-40),
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

      // Update particles
      setParticles((prev) =>
        prev
          .map((pt) => ({
            ...pt,
            x: pt.x + pt.vx,
            y: pt.y + pt.vy,
            vy: pt.vy - 0.02,
            life: pt.life + 1,
          }))
          .filter((pt) => pt.life < pt.maxLife)
      );

      if (p >= 1) {
        // Burst particles for break
        if (simulationResult === "break") {
          const burst: Particle[] = [];
          for (let i = 0; i < 60; i++) {
            const src =
              fittedAtoms[Math.floor(Math.random() * fittedAtoms.length)];
            if (!src) continue;
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            burst.push({
              x: src.x,
              y: src.y,
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
        setTimeout(() => setPhase("result"), 600);
        return;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [totalDuration, admin.simulationIntensity, fittedAtoms, simulationResult]);

  // Continue updating particles in result phase
  useEffect(() => {
    if (phase !== "result") return;
    let running = true;
    const tick = () => {
      if (!running) return;
      setParticles((prev) => {
        const next = prev
          .map((pt) => ({
            ...pt,
            x: pt.x + pt.vx,
            y: pt.y + pt.vy,
            vy: pt.vy + 0.05,
            life: pt.life + 1,
          }))
          .filter((pt) => pt.life < pt.maxLife);
        if (next.length === 0) return next;
        return next;
      });
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
    <div className="min-h-screen flex flex-col items-center justify-center gradient-bg-subtle relative overflow-hidden">
      {/* Heat wave overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsla(${
            350 - progress * 50
          }, 80%, 50%, ${progress * 0.2}) 0%, transparent 70%)`,
        }}
      />

      {/* Vignette intensifies */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, hsla(0, 0%, 0%, ${
            progress * 0.3
          }) 100%)`,
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 px-6 max-w-3xl w-full">
        {/* Temperature display */}
        <div className="text-center animate-fade-in">
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium mb-1">
            Temperatura
          </p>
          <p
            className="font-display text-5xl md:text-7xl font-bold transition-colors duration-300"
            style={{ color: tempColor }}
          >
            {Math.round(temperature)}°C
          </p>
        </div>

        {/* Molecule visualization */}
        <div className="relative w-full" style={{ maxWidth: "400px" }}>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-auto"
            ref={svgRef}
          >
            {/* Background glow */}
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
              r={220}
              fill="url(#heatGlow)"
            />

            {/* Particles */}
            {particles.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={pt.r * (1 - pt.life / pt.maxLife)}
                fill={pt.color}
                opacity={0.8 * (1 - pt.life / pt.maxLife)}
              />
            ))}

            {/* Bonds */}
            {fittedBonds.map((bond) => {
              const from = fittedAtoms.find((a) => a.id === bond.from);
              const to = fittedAtoms.find((a) => a.id === bond.to);
              if (!from || !to) return null;
              const offFrom = atomOffsets[bond.from] || { dx: 0, dy: 0 };
              const offTo = atomOffsets[bond.to] || { dx: 0, dy: 0 };

              const broken = phase === "result" && isBreak;
              const pulseWidth = 3 + bondPulse * progress * 2;
              const heatHue = progress > 0.5 ? 30 + (1 - progress) * 30 : 270;
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
              const off = atomOffsets[atom.id] || { dx: 0, dy: 0 };
              const broken = phase === "result" && isBreak;
              const burstAngle = (i / fittedAtoms.length) * Math.PI * 2;
              const burstDist = broken ? 100 + Math.random() * 40 : 0;

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
                  {/* Outer energy glow */}
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
                  {/* Inner glow ring */}
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
                  {/* Main atom */}
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

        {/* Progress bar */}
        {phase === "heating" && (
          <div className="w-full max-w-md">
            <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden backdrop-blur-sm">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress * 100}%`,
                  background: `linear-gradient(90deg, hsl(280, 70%, 55%), hsl(30, 80%, 55%), hsl(0, 80%, 50%))`,
                  boxShadow:
                    progress > 0.5
                      ? `0 0 ${progress * 15}px hsla(30, 90%, 55%, 0.5)`
                      : undefined,
                }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {progress < 0.3 && "Aquecendo suavemente..."}
              {progress >= 0.3 &&
                progress < 0.7 &&
                "⚡ Mais energia, mais vibração..."}
              {progress >= 0.7 && "🔥 Temperatura crítica!"}
            </p>
          </div>
        )}

        {/* Result */}
        {phase === "result" && (
          <div className="text-center animate-scale-in flex flex-col items-center gap-6">
            <div className="text-6xl">{isBreak ? "💥" : "✨"}</div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              {isBreak ? admin.breakMessage : admin.stableMessage}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {isBreak
                ? "Mais energia, mais vibração — maior chance de ruptura!"
                : "As ligações dessa molécula suportaram o aumento de energia térmica."}
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setScreen("builder");
                }}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Tentar outra
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={() => setScreen("explanation")}
              >
                Entender por quê <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
