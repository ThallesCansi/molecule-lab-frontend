/** @format */

import React from "react";
import { useExperience } from "@/context/ExperienceContext";
import { Button } from "@/components/ui/button";
import { WifiOff, RotateCcw, Wrench } from "lucide-react";

export default function ApiErrorScreen() {
  const { setScreen } = useExperience();

  return (
    <div className="min-h-screen gradient-bg-subtle flex items-center justify-center px-6 overflow-hidden relative">
      {/* blobs decorativos */}
      <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-destructive/10 blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 max-w-xl w-full glass-card glow-border p-10 rounded-3xl text-center animate-scale-in">
        {/* ícone */}
        <div className="mx-auto mb-6 w-24 h-24 rounded-3xl bg-destructive/15 flex items-center justify-center">
          <WifiOff className="w-12 h-12 text-destructive" />
        </div>

        {/* título */}
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 gradient-text">
          API indisponível
        </h1>

        {/* descrição */}
        <p className="text-muted-foreground text-lg leading-relaxed mb-8">
          Não conseguimos conectar ao servidor de análise molecular.
          <br />
          Talvez ele esteja reiniciando, offline ou sobrecarregado.
        </p>

        {/* status */}
        <div className="glass-card rounded-2xl p-4 mb-8 text-left">
          <div className="flex items-center gap-3 mb-3">
            <Wrench className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">
              O que você pode fazer:
            </span>
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Verifique se o backend está rodando</li>
            <li>• Confira a URL da API</li>
            <li>• Tente novamente em alguns segundos</li>
            <li>• Veja logs do servidor para mais detalhes</li>
          </ul>
        </div>

        {/* botões */}
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setScreen("builder")}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button
            variant="hero"
            size="lg"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    </div>
  );
}
