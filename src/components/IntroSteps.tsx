import React from 'react';
import { Atom, Zap, FlaskConical } from 'lucide-react';

const steps = [
  {
    icon: Atom,
    title: 'Monte',
    description: 'Escolha átomos e construa sua molécula',
  },
  {
    icon: Zap,
    title: 'Teste',
    description: 'Veja o que acontece quando a temperatura sobe',
  },
  {
    icon: FlaskConical,
    title: 'Descubra',
    description: 'Entenda por que ela sobreviveu — ou não',
  },
];

export default function IntroSteps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mx-auto">
      {steps.map((step, i) => (
        <div
          key={i}
          className="glass-card p-6 text-center animate-fade-in flex flex-col items-center gap-3"
          style={{ animationDelay: `${i * 0.15 + 0.3}s`, animationFillMode: 'backwards' }}
        >
          <div className="w-14 h-14 rounded-xl gradient-bg flex items-center justify-center">
            <step.icon className="w-7 h-7 text-primary-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground">{step.title}</h3>
          <p className="text-muted-foreground text-sm">{step.description}</p>
        </div>
      ))}
    </div>
  );
}
