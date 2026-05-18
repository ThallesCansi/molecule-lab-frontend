/** @format */

import React from "react";
import { useExperience } from "@/context/ExperienceContext";
import IntroSteps from "@/components/IntroSteps";
import { Button } from "@/components/ui/button";
import { Sparkles, FlaskConical, PencilRuler, Stars } from "lucide-react";

export default function LandingScreen() {
  const { setScreen } = useExperience();

  return (
    <div className="relative h-screen overflow-hidden bg-background">
      {/* 📄 Fundo estilo papel */}
      <div
        className="
          absolute inset-0 opacity-40 pointer-events-none
          bg-[linear-gradient(to_right,hsl(var(--border)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.08)_1px,transparent_1px)]
          bg-[size:42px_42px]
        "
      />

      {/* ✨ manchas coloridas */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-primary/15 blur-3xl animate-float" />
      <div
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/15 blur-3xl animate-float"
        style={{ animationDelay: "2s" }}
      />

      {/* 🌟 doodles */}
      <div className="absolute top-20 right-24 text-primary text-4xl rotate-12 opacity-70">
        ✦
      </div>

      <div className="absolute bottom-32 left-24 text-accent text-3xl -rotate-12 opacity-70">
        ✎
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* Badge */}
        <div className="paper-tag flex items-center gap-2 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm">Ciência Aberta • CNPEM • Ilum</span>
        </div>

        {/* 🧪 Ícone */}
        <div className="mb-8 relative">
          <div className="gradient-bg yellow atom-shadow w-28 h-28 rounded-[38%_62%_55%_45%/45%_45%_55%_55%] flex items-center justify-center rotate-[-6deg]">
            <FlaskConical className="w-14 h-14 text-foreground" />
          </div>

          <div className="absolute -top-3 -right-4 text-2xl animate-bounceSoft">
            ⭐
          </div>
        </div>

        {/* 📝 Título */}
        <h1
          className="
            font-display
            text-5xl
            sm:text-6xl
            md:text-8xl
            leading-[0.95]
            max-w-5xl
            animate-fade-in
          "
          style={{
            animationDelay: "0.1s",
            animationFillMode: "backwards",
          }}
        >
          Sobrevive ao calor?
          <br />
          <span className="gradient-text">Desafie sua molécula</span>
        </h1>

        {/* 📒 Subtítulo */}
        <div
          className="
            mt-8
            max-w-2xl
            gradient-bg-subtle
            p-6
            rotate-[0.4deg]
            animate-fade-in
          "
          style={{
            animationDelay: "0.2s",
            animationFillMode: "backwards",
          }}
        >
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Monte moléculas, aumente a temperatura e descubra quais estruturas
            conseguem sobreviver ao caos térmico.
          </p>

          <div className="mt-4 flex justify-center gap-3 flex-wrap">
            <span className="marker-highlight">Interativo</span>

            <span className="marker-highlight">Educacional</span>

            <span className="marker-highlight">Científico</span>
          </div>
        </div>

        {/* 🎮 CTA */}
        <div
          className="mt-10 animate-fade-in"
          style={{
            animationDelay: "0.3s",
            animationFillMode: "backwards",
          }}
        >
          <Button
            variant="hero"
            size="xl"
            onClick={() => setScreen("builder")}
            className="
              sticker-btn
              wiggle
              text-2xl
              px-10
              py-7
              rotate-[-2deg]
            "
          >
            <PencilRuler className="w-6 h-6 mr-2" />
            Começar Experimento
          </Button>
        </div>

        {/* ⭐ mini info */}
        <div className="mt-6 flex items-center gap-2 text-muted-foreground text-sm rotate-[1deg]">
          <Stars className="w-4 h-4 text-primary" />
          Crie • Teste • Descubra
        </div>

        {/* 📚 Steps */}
        {/* <div className="mt-16 w-full max-w-5xl">
          <IntroSteps />
        </div> */}
      </div>
    </div>
  );
}
