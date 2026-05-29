/** @format */

import React, { useState, useEffect, useCallback } from "react";
import { useExperience } from "@/context/ExperienceContext";
import { useMoleculeBuilder } from "@/hooks/useMoleculeBuilder";
import { Button } from "@/components/ui/button";
import BuilderCanvas from "@/components/builder/BuilderCanvas";
import BuilderToolbar from "@/components/builder/BuilderToolbar";
import AtomPalette from "@/components/builder/AtomPalette";
import PresetsPanel from "@/components/builder/PresetsPanel";
import { ArrowLeft, Flame, Loader2 } from "lucide-react";
import { createMoleculeSimulation } from "@/lib/moleculeApi";

type Tool = "select" | "add" | "move" | "delete" | "pan";
type Tab = "free" | "presets";

export default function BuilderScreen() {
  const { setScreen, setMolecule, setMoleculeAnalysis, admin } =
    useExperience();
  const builder = useMoleculeBuilder();
  const [tool, setTool] = useState<Tool>("add");
  const [tab, setTab] = useState<Tab>("free");

  // Estado da chamada de API
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) builder.redo();
        else builder.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        builder.redo();
      }
      if (e.key === "s") setTool("select");
      if (e.key === "a") setTool("add");
      if (e.key === "m") setTool("move");
      if (e.key === "n") setTool("pan");
      if (e.key === "d") setTool("delete");
      if (e.key === "b")
        builder.setBondOrder(
          builder.bondOrder >= 3 ? 1 : builder.bondOrder + 1
        );
      if (e.key === " ") {
        e.preventDefault();
        setTool("pan");
      }
    };
    const keyUpHandler = (e: KeyboardEvent) => {
      if (e.key === " ") setTool("add");
    };
    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", keyUpHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", keyUpHandler);
    };
  }, [builder]);

  /**
   * Ao clicar em "Testar":
   *  1. Serializa a molécula em grafo e cria uma simulação no backend
   *  2. Armazena dados estáticos e a URL do stream no contexto
   *  3. Navega para a tela de simulação, que acompanha os eventos SSE
   *  4. Se a chamada falhar, exibe a tela de erro da API
   */
  const handleTest = useCallback(async () => {
    setApiError(null);
    setIsSubmitting(true);

    // Persiste a molécula no contexto independente de sucesso/falha da API
    setMolecule({
      atoms: builder.atoms,
      bonds: builder.bonds.map((b) => ({
        id: b.id,
        from: b.from,
        to: b.to,
        order: b.order,
      })),
    });

    console.log(builder.atoms, builder.bonds);

    try {
      const analysis = await createMoleculeSimulation(
        builder.atoms,
        builder.bonds,
        admin.simulationPreset
      );
      setMoleculeAnalysis(analysis);
      setIsSubmitting(false);
      setScreen("simulation");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("[moleculeApi] createMoleculeSimulation falhou:", msg);
      setApiError(msg);
      setScreen("api-error");
    }
  }, [
    builder.atoms,
    builder.bonds,
    admin.simulationPreset,
    setMolecule,
    setMoleculeAnalysis,
    setScreen,
  ]);

  const handleExport = useCallback(() => {
    const graph = {
      atoms: builder.atoms.map((a) => ({
        id: a.id,
        symbol: a.symbol,
        x: a.x,
        y: a.y,
      })),
      bonds: builder.bonds.map((b) => ({
        id: b.id,
        from: b.from,
        to: b.to,
        order: b.order,
      })),
    };

    const json = JSON.stringify({ graph }, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `molecule_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [builder.atoms, builder.bonds]);

  const handleSelectAtom = useCallback(
    (symbol: string) => {
      builder.setSelectedAtomType(symbol);
      setTool("add");
    },
    [builder]
  );

  return (
    <div className="h-screen flex flex-col gradient-bg-subtle overflow-hidden">
      <header className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-border/50 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => setScreen("landing")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h2 className="font-display text-lg font-semibold gradient-text">
          Construa sua molécula
        </h2>
        <Button
          variant="hero"
          size="sm"
          onClick={handleTest}
          disabled={builder.atoms.length < 1 || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Flame className="w-4 h-4 mr-1" />
          )}
          {isSubmitting ? "Analisando…" : "Testar"}
        </Button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        <aside className="w-full md:w-60 border-b md:border-b-0 md:border-r border-border/50 p-3 flex flex-col gap-3 overflow-hidden shrink-0">
          <div className="flex gap-1 glass-card p-1 rounded-xl shrink-0">
            {(
              [
                ["free", "Livre"],
                ["presets", "Prontas"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 text-xs py-2 rounded-lg transition-all font-medium ${
                  tab === key
                    ? "gradient-bg text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "free" && (
            <div className="flex flex-col gap-3 overflow-hidden min-h-0">
              <AtomPalette
                selectedAtomType={builder.selectedAtomType}
                onSelect={handleSelectAtom}
              />
              <div className="glass-card p-3 rounded-xl text-xs text-muted-foreground shrink-0">
                <p className="font-medium text-foreground mb-1">💡 Dicas</p>
                <ul className="space-y-1">
                  <li>• Escolha um átomo e clique no canvas</li>
                  <li>• Shift+arrastar ou espaço para navegar</li>
                  <li>• Scroll para zoom</li>
                </ul>
              </div>
            </div>
          )}

          {tab === "presets" && (
            <div className="flex-1 overflow-y-auto min-h-0">
              <PresetsPanel onLoad={builder.loadPreset} />
            </div>
          )}
        </aside>

        <main className="flex-1 relative p-3 flex gap-2 overflow-hidden min-h-0">
          <div className="z-10 shrink-0">
            <BuilderToolbar
              tool={tool}
              setTool={setTool}
              canUndo={builder.canUndo}
              canRedo={builder.canRedo}
              onUndo={builder.undo}
              onRedo={builder.redo}
              onClear={builder.clearAll}
              onComplete={builder.completeWithHydrogens}
              showHydrogens={builder.showHydrogens}
              onToggleH={() => builder.setShowHydrogens(!builder.showHydrogens)}
              hasAtoms={builder.atoms.length > 0}
              bondOrder={builder.bondOrder}
              setBondOrder={builder.setBondOrder}
            />
          </div>

          <div className="flex-1 min-h-0">
            <BuilderCanvas
              atoms={builder.atoms}
              bonds={builder.bonds}
              activeAtomId={builder.activeAtomId}
              selectedAtomType={builder.selectedAtomType}
              showHydrogens={builder.showHydrogens}
              implicitH={builder.implicitH}
              tool={tool}
              onCanvasClick={builder.addAtom}
              onAtomClick={builder.clickAtom}
              onAtomSelect={builder.setActiveAtomId}
              onAtomDelete={builder.deleteAtom}
              onBondClick={builder.deleteBond}
              onAtomMove={builder.moveAtom}
              onMoveEnd={builder.finishMove}
              getGhostPosition={builder.getGhostPosition}
              findAtomAt={builder.findAtomAt}
            />
          </div>

          {/* Erro de API */}
          {apiError && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 glass-card glow-border px-5 py-3 rounded-full text-sm text-destructive animate-scale-in z-20 max-w-sm text-center">
              ⚠️ Backend indisponível — simulação local ativada
            </div>
          )}

          {/* Erro de valência */}
          {builder.valenceError && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-card glow-border px-5 py-3 rounded-full text-sm text-accent animate-scale-in z-20">
              ⚠️ {builder.valenceError}
            </div>
          )}

          {builder.atoms.length > 0 &&
            builder.atoms.length < 3 &&
            !builder.valenceError && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-card px-4 py-2 rounded-full text-sm text-muted-foreground animate-fade-in z-10">
                💡 Continue clicando para expandir a molécula
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
