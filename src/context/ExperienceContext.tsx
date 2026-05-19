import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MoleculeAnalysis } from '@/lib/moleculeApi';

export interface Atom {
  id: string;
  symbol: string;
  x: number;
  y: number;
  color: string;
}

export interface Bond {
  id: string;
  from: string;
  to: string;
}

export interface MoleculeData {
  atoms: Atom[];
  bonds: Bond[];
  name?: string;
}

export interface AdminSettings {
  simulationIntensity: number; // 1-10
  forceResult: 'auto' | 'stable' | 'break';
  animationDuration: 'short' | 'medium' | 'long';
  stableMessage: string;
  breakMessage: string;
  mode: 'event' | 'demo';
}

type Screen = 'landing' | 'builder' | 'simulation' | 'explanation';

interface ExperienceState {
  screen: Screen;
  setScreen: (s: Screen) => void;
  molecule: MoleculeData;
  setMolecule: (m: MoleculeData) => void;
  simulationResult: 'stable' | 'break' | null;
  setSimulationResult: (r: 'stable' | 'break' | null) => void;
  admin: AdminSettings;
  setAdmin: (a: AdminSettings) => void;
  resetExperience: () => void;
  /**
   * Resultado da análise retornado pelo backend / RDKit.
   * É null enquanto a análise não foi concluída ou se a chamada falhou.
   */
  moleculeAnalysis: MoleculeAnalysis | null;
  setMoleculeAnalysis: (a: MoleculeAnalysis | null) => void;
}

const defaultAdmin: AdminSettings = {
  simulationIntensity: 5,
  forceResult: 'auto',
  animationDuration: 'medium',
  stableMessage: 'Sua molécula resistiu ao calor! 🎉',
  breakMessage: 'As ligações não suportaram a energia! 💥',
  mode: 'event',
};

const defaultMolecule: MoleculeData = { atoms: [], bonds: [], name: undefined };

const ExperienceContext = createContext<ExperienceState | null>(null);

export function ExperienceProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<Screen>('landing');
  const [molecule, setMolecule] = useState<MoleculeData>(defaultMolecule);
  const [simulationResult, setSimulationResult] = useState<'stable' | 'break' | null>(null);
  const [admin, setAdmin] = useState<AdminSettings>(defaultAdmin);
  const [moleculeAnalysis, setMoleculeAnalysis] = useState<MoleculeAnalysis | null>(null);

  const resetExperience = () => {
    setScreen('landing');
    setMolecule(defaultMolecule);
    setSimulationResult(null);
    setMoleculeAnalysis(null);
  };

  return (
    <ExperienceContext.Provider
      value={{
        screen,
        setScreen,
        molecule,
        setMolecule,
        simulationResult,
        setSimulationResult,
        admin,
        setAdmin,
        resetExperience,
        moleculeAnalysis,
        setMoleculeAnalysis,
      }}
    >
      {children}
    </ExperienceContext.Provider>
  );
}

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error('useExperience must be used within ExperienceProvider');
  return ctx;
}
