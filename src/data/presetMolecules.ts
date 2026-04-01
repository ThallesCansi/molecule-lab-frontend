import { MoleculeData } from '@/context/ExperienceContext';

const ATOM_COLORS: Record<string, string> = {
  H: '#E8E8E8',
  C: '#404040',
  O: '#FF4444',
  N: '#3344FF',
};

export { ATOM_COLORS };

export const presetMolecules: (MoleculeData & { description: string; stability: number })[] = [
  {
    name: 'Água (H₂O)',
    description: 'A molécula essencial para a vida',
    stability: 0.9,
    atoms: [
      { id: 'o1', symbol: 'O', x: 300, y: 200, color: ATOM_COLORS.O },
      { id: 'h1', symbol: 'H', x: 220, y: 270, color: ATOM_COLORS.H },
      { id: 'h2', symbol: 'H', x: 380, y: 270, color: ATOM_COLORS.H },
    ],
    bonds: [
      { id: 'b1', from: 'o1', to: 'h1' },
      { id: 'b2', from: 'o1', to: 'h2' },
    ],
  },
  {
    name: 'Metano (CH₄)',
    description: 'O gás natural mais simples',
    stability: 0.85,
    atoms: [
      { id: 'c1', symbol: 'C', x: 300, y: 200, color: ATOM_COLORS.C },
      { id: 'h1', symbol: 'H', x: 240, y: 140, color: ATOM_COLORS.H },
      { id: 'h2', symbol: 'H', x: 360, y: 140, color: ATOM_COLORS.H },
      { id: 'h3', symbol: 'H', x: 240, y: 260, color: ATOM_COLORS.H },
      { id: 'h4', symbol: 'H', x: 360, y: 260, color: ATOM_COLORS.H },
    ],
    bonds: [
      { id: 'b1', from: 'c1', to: 'h1' },
      { id: 'b2', from: 'c1', to: 'h2' },
      { id: 'b3', from: 'c1', to: 'h3' },
      { id: 'b4', from: 'c1', to: 'h4' },
    ],
  },
  {
    name: 'Amônia (NH₃)',
    description: 'Presente em fertilizantes',
    stability: 0.7,
    atoms: [
      { id: 'n1', symbol: 'N', x: 300, y: 180, color: ATOM_COLORS.N },
      { id: 'h1', symbol: 'H', x: 230, y: 260, color: ATOM_COLORS.H },
      { id: 'h2', symbol: 'H', x: 300, y: 280, color: ATOM_COLORS.H },
      { id: 'h3', symbol: 'H', x: 370, y: 260, color: ATOM_COLORS.H },
    ],
    bonds: [
      { id: 'b1', from: 'n1', to: 'h1' },
      { id: 'b2', from: 'n1', to: 'h2' },
      { id: 'b3', from: 'n1', to: 'h3' },
    ],
  },
  {
    name: 'CO₂',
    description: 'Gás carbônico, vilão do efeito estufa',
    stability: 0.95,
    atoms: [
      { id: 'c1', symbol: 'C', x: 300, y: 200, color: ATOM_COLORS.C },
      { id: 'o1', symbol: 'O', x: 200, y: 200, color: ATOM_COLORS.O },
      { id: 'o2', symbol: 'O', x: 400, y: 200, color: ATOM_COLORS.O },
    ],
    bonds: [
      { id: 'b1', from: 'o1', to: 'c1' },
      { id: 'b2', from: 'c1', to: 'o2' },
    ],
  },
  {
    name: 'Etanol (C₂H₆O)',
    description: 'Presente em bebidas e combustíveis',
    stability: 0.6,
    atoms: [
      { id: 'c1', symbol: 'C', x: 240, y: 200, color: ATOM_COLORS.C },
      { id: 'c2', symbol: 'C', x: 340, y: 200, color: ATOM_COLORS.C },
      { id: 'o1', symbol: 'O', x: 440, y: 200, color: ATOM_COLORS.O },
      { id: 'h1', symbol: 'H', x: 190, y: 150, color: ATOM_COLORS.H },
      { id: 'h2', symbol: 'H', x: 190, y: 250, color: ATOM_COLORS.H },
      { id: 'h3', symbol: 'H', x: 240, y: 130, color: ATOM_COLORS.H },
      { id: 'h4', symbol: 'H', x: 340, y: 140, color: ATOM_COLORS.H },
      { id: 'h5', symbol: 'H', x: 340, y: 260, color: ATOM_COLORS.H },
      { id: 'h6', symbol: 'H', x: 500, y: 200, color: ATOM_COLORS.H },
    ],
    bonds: [
      { id: 'b1', from: 'c1', to: 'c2' },
      { id: 'b2', from: 'c2', to: 'o1' },
      { id: 'b3', from: 'c1', to: 'h1' },
      { id: 'b4', from: 'c1', to: 'h2' },
      { id: 'b5', from: 'c1', to: 'h3' },
      { id: 'b6', from: 'c2', to: 'h4' },
      { id: 'b7', from: 'c2', to: 'h5' },
      { id: 'b8', from: 'o1', to: 'h6' },
    ],
  },
];
