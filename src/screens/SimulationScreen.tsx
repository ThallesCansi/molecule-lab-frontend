import React, { useEffect, useState, useRef } from 'react';
import { useExperience } from '@/context/ExperienceContext';
import { Button } from '@/components/ui/button';
import { ArrowRight, RotateCcw } from 'lucide-react';

export default function SimulationScreen() {
  const { molecule, admin, setSimulationResult, setScreen, simulationResult } = useExperience();
  const [phase, setPhase] = useState<'heating' | 'result'>('heating');
  const [progress, setProgress] = useState(0);
  const [temperature, setTemperature] = useState(25);
  const svgRef = useRef<SVGSVGElement>(null);
  const [shakeIntensity, setShakeIntensity] = useState(0);
  const [atomOffsets, setAtomOffsets] = useState<Record<string, { dx: number; dy: number }>>({});

  const durations = { short: 4000, medium: 7000, long: 10000 };
  const totalDuration = durations[admin.animationDuration];

  // Determine result
  useEffect(() => {
    let result: 'stable' | 'break';
    if (admin.forceResult === 'stable') result = 'stable';
    else if (admin.forceResult === 'break') result = 'break';
    else {
      // Simple mock: more atoms = less stable, bonds help
      const ratio = molecule.bonds.length / Math.max(molecule.atoms.length, 1);
      result = ratio >= 0.8 ? 'stable' : 'break';
    }
    setSimulationResult(result);
  }, [molecule, admin.forceResult, setSimulationResult]);

  // Animation loop
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / totalDuration, 1);
      setProgress(p);
      setTemperature(25 + p * 975);
      setShakeIntensity(p * admin.simulationIntensity);

      // Random atom offsets for vibration
      const offsets: Record<string, { dx: number; dy: number }> = {};
      const intensity = p * admin.simulationIntensity * 2;
      molecule.atoms.forEach(atom => {
        offsets[atom.id] = {
          dx: (Math.random() - 0.5) * intensity,
          dy: (Math.random() - 0.5) * intensity,
        };
      });
      setAtomOffsets(offsets);

      if (p >= 1) {
        clearInterval(interval);
        setTimeout(() => setPhase('result'), 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [totalDuration, admin.simulationIntensity, molecule.atoms]);

  const isBreak = simulationResult === 'break';
  const tempColor = progress < 0.3 ? 'hsl(280, 70%, 55%)' : progress < 0.7 ? 'hsl(30, 90%, 55%)' : 'hsl(0, 80%, 55%)';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-bg-subtle relative overflow-hidden">
      {/* Heat wave overlay */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 50%, hsla(0, 80%, 50%, ${progress * 0.15}) 0%, transparent 70%)`,
        }}
      />

      {/* Particles burst on break */}
      {phase === 'result' && isBreak && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                width: Math.random() * 8 + 4,
                height: Math.random() * 8 + 4,
                background: `hsl(${Math.random() * 60 + 320}, 80%, 60%)`,
                animation: `breakApart ${Math.random() * 1 + 0.5}s ease-out forwards`,
                transform: `translate(${(Math.random() - 0.5) * 400}px, ${(Math.random() - 0.5) * 400}px)`,
                animationDelay: `${Math.random() * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center gap-8 px-6 max-w-2xl w-full">
        {/* Temperature display */}
        <div className="text-center animate-fade-in">
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium mb-1">Temperatura</p>
          <p className="font-display text-5xl md:text-7xl font-bold transition-colors duration-300" style={{ color: tempColor }}>
            {Math.round(temperature)}°C
          </p>
        </div>

        {/* Molecule visualization */}
        <div
          className="relative w-full aspect-square max-w-md"
          style={{
            animation: phase === 'heating' ? `moleculeVibrate ${Math.max(0.1, 0.5 - shakeIntensity * 0.04)}s linear infinite` : undefined,
          }}
        >
          <svg viewBox="0 0 600 400" className="w-full h-full" ref={svgRef}>
            {/* Background glow */}
            <defs>
              <radialGradient id="heatGlow">
                <stop offset="0%" stopColor={`hsla(${350 - progress * 30}, 80%, 50%, ${progress * 0.3})`} />
                <stop offset="100%" stopColor="transparent" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="200" r="180" fill="url(#heatGlow)" />

            {/* Bonds */}
            {molecule.bonds.map((bond, i) => {
              const from = molecule.atoms.find(a => a.id === bond.from);
              const to = molecule.atoms.find(a => a.id === bond.to);
              if (!from || !to) return null;
              const offFrom = atomOffsets[bond.from] || { dx: 0, dy: 0 };
              const offTo = atomOffsets[bond.to] || { dx: 0, dy: 0 };

              const broken = phase === 'result' && isBreak;
              return (
                <line
                  key={bond.id}
                  x1={from.x + offFrom.dx}
                  y1={from.y + offFrom.dy}
                  x2={to.x + offTo.dx}
                  y2={to.y + offTo.dy}
                  stroke={progress > 0.7 ? `hsl(${30 - progress * 20}, 80%, 55%)` : 'hsl(270, 10%, 50%)'}
                  strokeWidth={broken ? 0 : 3}
                  strokeLinecap="round"
                  style={{ transition: broken ? 'stroke-width 0.5s' : undefined }}
                />
              );
            })}

            {/* Atoms */}
            {molecule.atoms.map((atom, i) => {
              const radius = atom.symbol === 'H' ? 18 : 24;
              const off = atomOffsets[atom.id] || { dx: 0, dy: 0 };
              const broken = phase === 'result' && isBreak;
              const burstAngle = (i / molecule.atoms.length) * Math.PI * 2;
              const burstDist = broken ? 80 : 0;

              return (
                <g
                  key={atom.id}
                  style={{
                    transform: broken
                      ? `translate(${Math.cos(burstAngle) * burstDist}px, ${Math.sin(burstAngle) * burstDist}px)`
                      : undefined,
                    transition: 'transform 0.8s ease-out',
                    opacity: broken ? 0.5 : 1,
                  }}
                >
                  {/* Glow intensifies */}
                  <circle
                    cx={atom.x + off.dx}
                    cy={atom.y + off.dy}
                    r={radius + 8 + progress * 12}
                    fill={progress > 0.5 ? `hsla(30, 80%, 50%, ${progress * 0.3})` : atom.color}
                    opacity={0.15 + progress * 0.2}
                  />
                  <circle
                    cx={atom.x + off.dx}
                    cy={atom.y + off.dy}
                    r={radius}
                    fill={atom.color}
                    stroke={`hsla(${40 - progress * 40}, 80%, 55%, ${progress * 0.6})`}
                    strokeWidth={1.5 + progress * 2}
                  />
                  <text
                    x={atom.x + off.dx}
                    y={atom.y + off.dy}
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
          </svg>
        </div>

        {/* Progress bar */}
        {phase === 'heating' && (
          <div className="w-full max-w-md">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${progress * 100}%`,
                  background: `linear-gradient(90deg, hsl(280, 70%, 55%), hsl(30, 80%, 55%), hsl(0, 80%, 50%))`,
                }}
              />
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {progress < 0.3 && 'Aquecendo suavemente...'}
              {progress >= 0.3 && progress < 0.7 && 'Mais energia, mais vibração...'}
              {progress >= 0.7 && 'Temperatura crítica! 🔥'}
            </p>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="text-center animate-scale-in flex flex-col items-center gap-6">
            <div className={`text-6xl ${isBreak ? '' : ''}`}>
              {isBreak ? '💥' : '✨'}
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              {isBreak ? admin.breakMessage : admin.stableMessage}
            </h2>
            <p className="text-muted-foreground max-w-md">
              {isBreak
                ? 'Mais energia, mais vibração — maior chance de ruptura!'
                : 'As ligações dessa molécula suportaram o aumento de energia térmica.'}
            </p>
            <div className="flex gap-4 flex-wrap justify-center">
              <Button variant="outline" size="lg" onClick={() => { setScreen('builder'); }}>
                <RotateCcw className="w-4 h-4 mr-2" /> Tentar outra
              </Button>
              <Button variant="hero" size="lg" onClick={() => setScreen('explanation')}>
                Entender por quê <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
