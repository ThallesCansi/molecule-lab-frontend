import React from 'react';
import { useExperience } from '@/context/ExperienceContext';
import { Button } from '@/components/ui/button';
import { RotateCcw, Atom, Flame, Zap, BookOpen } from 'lucide-react';

const concepts = [
  {
    icon: Atom,
    title: 'Vibração Molecular',
    text: 'Toda molécula vibra. Os átomos estão sempre em movimento, como se estivessem dançando. Quanto mais quente, mais rápido eles se movem.',
  },
  {
    icon: Flame,
    title: 'Energia Térmica',
    text: 'Quando aquecemos uma molécula, estamos entregando energia. Essa energia faz os átomos vibrarem cada vez mais forte.',
  },
  {
    icon: Zap,
    title: 'Quebra de Ligação',
    text: 'Se a vibração for intensa demais, as ligações entre os átomos não aguentam e se rompem. A molécula se desfaz!',
  },
  {
    icon: BookOpen,
    title: 'Estabilidade',
    text: 'Moléculas com ligações fortes e bem distribuídas resistem melhor ao calor. A estrutura importa! É por isso que água (H₂O) é mais estável que outras moléculas.',
  },
];

export default function ExplanationScreen() {
  const { simulationResult, resetExperience, molecule } = useExperience();
  const isBreak = simulationResult === 'break';

  return (
    <div className="min-h-screen gradient-bg-subtle flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-3xl w-full flex flex-col items-center gap-10">
        {/* Header */}
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">{isBreak ? '🔬' : '🧪'}</div>
          <h1 className="font-display text-3xl md:text-5xl font-bold gradient-text mb-4">
            O que aconteceu?
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {isBreak
              ? `Sua molécula${molecule.name ? ` (${molecule.name})` : ''} não resistiu ao aumento de temperatura. Vamos entender por quê!`
              : `Sua molécula${molecule.name ? ` (${molecule.name})` : ''} se mostrou estável! Descubra o que torna uma molécula resistente.`}
          </p>
        </div>

        {/* Result summary card */}
        <div className="glass-card glow-border p-6 md:p-8 w-full animate-fade-in" style={{ animationDelay: '0.15s', animationFillMode: 'backwards' }}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isBreak ? 'bg-destructive/20' : 'gradient-bg'}`}>
              {isBreak ? '💥' : '✨'}
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold text-foreground">
                {isBreak ? 'Molécula rompida' : 'Molécula estável'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {molecule.atoms.length} átomos · {molecule.bonds.length} ligações
              </p>
            </div>
          </div>
          <p className="text-muted-foreground">
            {isBreak
              ? 'A proporção entre ligações e átomos indica fragilidade estrutural. Com menos ligações por átomo, a molécula tem pontos fracos que cedem sob alta energia.'
              : 'Boa proporção entre ligações e átomos! A energia distribuída pelas ligações manteve a estrutura coesa mesmo em temperatura elevada.'}
          </p>
        </div>

        {/* Concept cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {concepts.map((c, i) => (
            <div
              key={i}
              className="glass-card p-6 animate-fade-in"
              style={{ animationDelay: `${i * 0.1 + 0.3}s`, animationFillMode: 'backwards' }}
            >
              <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center mb-3">
                <c.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>

        {/* Future integration placeholder */}
        <div className="glass-card p-6 w-full text-center animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'backwards' }}>
          <p className="text-muted-foreground text-sm">
            📱 Em breve: escaneie um QR code para levar este conteúdo com você!
          </p>
        </div>

        {/* CTA */}
        <Button variant="hero" size="xl" onClick={resetExperience} className="animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'backwards' }}>
          <RotateCcw className="w-5 h-5 mr-2" /> Recomeçar experiência
        </Button>
      </div>
    </div>
  );
}
