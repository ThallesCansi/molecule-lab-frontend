import React from 'react';
import {
  Undo2,
  Redo2,
  Trash2,
  MousePointer,
  Hand,
  Move,
  Atom,
  EyeOff,
  Eye,
  Plus,
  Download,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Tool = 'select' | 'add' | 'move' | 'delete' | 'pan';

interface BuilderToolbarProps {
  tool: Tool;
  setTool: (t: Tool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onComplete: () => void;
  showHydrogens: boolean;
  onToggleH: () => void;
  hasAtoms: boolean;
  bondOrder: number;
  setBondOrder: (n: number) => void;
  onExport: () => void;
}

const ToolBtn = ({
  icon: Icon,
  label,
  active,
  onClick,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <TooltipProvider delayDuration={300}>
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled}
          className={`p-2.5 rounded-xl transition-all ${
            active
              ? 'glass-card glow-border text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          } ${disabled ? 'opacity-30 pointer-events-none' : ''}`}
        >
          <Icon className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function BuilderToolbar({
  tool, setTool, canUndo, canRedo, onUndo, onRedo, onClear, onComplete,
  showHydrogens, onToggleH, hasAtoms, bondOrder, setBondOrder, onExport,
}: BuilderToolbarProps) {
  return (
    <div className="flex flex-col gap-1.5 p-2 glass-card rounded-2xl">
      <ToolBtn icon={MousePointer} label="Selecionar (S)" active={tool === 'select'} onClick={() => setTool('select')} />
      <ToolBtn icon={Plus} label="Adicionar (A)" active={tool === 'add'} onClick={() => setTool('add')} />
      <ToolBtn icon={Move} label="Mover átomo (M)" active={tool === 'move'} onClick={() => setTool('move')} />
      <ToolBtn icon={Hand} label="Navegar canvas (N)" active={tool === 'pan'} onClick={() => setTool('pan')} />
      <ToolBtn icon={Trash2} label="Apagar (D)" active={tool === 'delete'} onClick={() => setTool('delete')} />

      <div className="border-t border-border/30 my-1" />

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setBondOrder(bondOrder >= 3 ? 1 : bondOrder + 1)}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all text-xs font-bold"
            >
              {bondOrder === 1 ? '—' : bondOrder === 2 ? '=' : '≡'}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            Ligação {bondOrder === 1 ? 'simples' : bondOrder === 2 ? 'dupla' : 'tripla'} (B)
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="border-t border-border/30 my-1" />

      <ToolBtn icon={Undo2} label="Desfazer (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
      <ToolBtn icon={Redo2} label="Refazer (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} />

      <div className="border-t border-border/30 my-1" />

      <ToolBtn
        icon={showHydrogens ? Eye : EyeOff}
        label={showHydrogens ? 'Ocultar H' : 'Mostrar H'}
        onClick={onToggleH}
      />
      <ToolBtn icon={Atom} label="Completar H" onClick={onComplete} disabled={!hasAtoms} />

      <div className="border-t border-border/30 my-1" />

      <ToolBtn
        icon={Download}
        label="Exportar grafo (.json)"
        onClick={onExport}
        disabled={!hasAtoms}
      />

      <div className="border-t border-border/30 my-1" />

      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onClear}
              disabled={!hasAtoms}
              className={`p-2.5 rounded-xl transition-all text-destructive hover:bg-destructive/10 ${
                !hasAtoms ? 'opacity-30 pointer-events-none' : ''
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">Limpar tudo</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
