import React from 'react';
import { useExperience } from '@/context/ExperienceContext';
import ParticlesBackground from '@/components/ParticlesBackground';
import IntroSteps from '@/components/IntroSteps';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function LandingScreen() {
  const { setScreen } = useExperience();

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden gradient-bg-subtle">
      <ParticlesBackground />

      {/* Decorative orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: '3s' }} />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 py-16 max-w-4xl text-center">
        {/* Badge */}
        <div className="glass-card px-4 py-1.5 rounded-full flex items-center gap-2 animate-fade-in text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-accent" />
          Ilum — Escola de Ciência
        </div>

        {/* Title */}
        <h1
          className="font-display text-4xl sm:text-5xl md:text-7xl font-bold leading-tight animate-fade-in"
          style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}
        >
          Sobrevive ao calor?{' '}
          <span className="gradient-text">Desafie sua molécula</span>
        </h1>

        {/* Subtitle */}
        <p
          className="text-lg md:text-xl text-muted-foreground max-w-2xl animate-fade-in"
          style={{ animationDelay: '0.2s', animationFillMode: 'backwards' }}
        >
          Monte uma molécula, aqueça e descubra se ela resiste.
          Uma experiência interativa sobre estabilidade molecular.
        </p>

        {/* CTA */}
        <Button
          variant="hero"
          size="xl"
          onClick={() => setScreen('builder')}
          className="animate-fade-in"
          style={{ animationDelay: '0.3s', animationFillMode: 'backwards' }}
        >
          Começar
        </Button>

        {/* Steps */}
        <IntroSteps />
      </div>
    </div>
  );
}
