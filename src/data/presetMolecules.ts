import type { Atom, MoleculeData } from '@/context/ExperienceContext';
import type { BondWithOrder } from '@/lib/moleculeEngine';

const ATOM_COLORS: Record<string, string> = {
  H: '#E8E8E8',
  C: '#404040',
  O: '#FF4444',
  N: '#3344FF',
  S: '#DDCC22',
  P: '#FF8800',
  F: '#22CC44',
  Cl: '#22CC44',
  Br: '#992200',
};

export { ATOM_COLORS };

export type PresetMolecule = Omit<MoleculeData, 'bonds'> & {
  description: string;
  formula: string;
  stability: number;
  bonds: BondWithOrder[];
};

const HBL = 48; // H bond length

function atom(id: string, symbol: string, x: number, y: number): Atom {
  return { id, symbol, x, y, color: ATOM_COLORS[symbol] || '#888' };
}

function bond(id: string, from: string, to: string, order: 1 | 2 | 3 = 1): BondWithOrder {
  return { id, from, to, order };
}

function h(id: string, parent: { x: number; y: number }, angleDeg: number): Atom {
  const rad = (angleDeg * Math.PI) / 180;
  return atom(
    id,
    'H',
    Math.round(parent.x + HBL * Math.cos(rad)),
    Math.round(parent.y + HBL * Math.sin(rad))
  );
}

export const presetMolecules: PresetMolecule[] = [
  {
    name: 'Água (H₂O)',
    description: 'Molécula polar com duas ligações O-H',
    formula: 'H2O',
    stability: 0.9,
    atoms: [
      atom('o1', 'O', 300, 220),
      h('h1', { x: 300, y: 220 }, -150),
      h('h2', { x: 300, y: 220 }, -30),
    ],
    bonds: [
      bond('b1', 'o1', 'h1'),
      bond('b2', 'o1', 'h2'),
    ],
  },
  {
    name: 'Metano (CH₄)',
    description: 'Alcano mais simples, com quatro ligações C-H',
    formula: 'CH4',
    stability: 0.85,
    atoms: [
      atom('c1', 'C', 300, 220),
      h('h1', { x: 300, y: 220 }, -90),
      h('h2', { x: 300, y: 220 }, 0),
      h('h3', { x: 300, y: 220 }, 90),
      h('h4', { x: 300, y: 220 }, 180),
    ],
    bonds: [
      bond('b1', 'c1', 'h1'),
      bond('b2', 'c1', 'h2'),
      bond('b3', 'c1', 'h3'),
      bond('b4', 'c1', 'h4'),
    ],
  },
  {
    name: 'Amônia (NH₃)',
    description: 'Base molecular simples com três ligações N-H',
    formula: 'NH3',
    stability: 0.7,
    atoms: [
      atom('n1', 'N', 300, 220),
      h('h1', { x: 300, y: 220 }, -120),
      h('h2', { x: 300, y: 220 }, -60),
      h('h3', { x: 300, y: 220 }, 90),
    ],
    bonds: [
      bond('b1', 'n1', 'h1'),
      bond('b2', 'n1', 'h2'),
      bond('b3', 'n1', 'h3'),
    ],
  },
  {
    name: 'Dióxido de Carbono (CO₂)',
    description: 'Molécula linear O=C=O',
    formula: 'CO2',
    stability: 0.95,
    atoms: [
      atom('o1', 'O', 220, 220),
      atom('c1', 'C', 300, 220),
      atom('o2', 'O', 380, 220),
    ],
    bonds: [
      bond('b1', 'o1', 'c1', 2),
      bond('b2', 'c1', 'o2', 2),
    ],
  },
  {
    name: 'Nitrogênio (N₂)',
    description: 'Molécula diatômica com ligação tripla N≡N',
    formula: 'N2',
    stability: 0.98,
    atoms: [
      atom('n1', 'N', 260, 220),
      atom('n2', 'N', 340, 220),
    ],
    bonds: [
      bond('b1', 'n1', 'n2', 3),
    ],
  },
  (() => {
    const c1 = { x: 260, y: 220 };
    const c2 = { x: 340, y: 220 };
    return {
      name: 'Eteno (C₂H₄)',
      description: 'Alceno simples com ligação dupla C=C',
      formula: 'C2H4',
      stability: 0.68,
      atoms: [
        atom('c1', 'C', c1.x, c1.y),
        atom('c2', 'C', c2.x, c2.y),
        h('h1', c1, -130),
        h('h2', c1, 130),
        h('h3', c2, -50),
        h('h4', c2, 50),
      ],
      bonds: [
        bond('b1', 'c1', 'c2', 2),
        bond('b2', 'c1', 'h1'),
        bond('b3', 'c1', 'h2'),
        bond('b4', 'c2', 'h3'),
        bond('b5', 'c2', 'h4'),
      ],
    };
  })(),
  (() => {
    const c1 = { x: 260, y: 220 };
    const c2 = { x: 340, y: 220 };
    return {
      name: 'Etino / Acetileno (C₂H₂)',
      description: 'Alcino simples com ligação tripla C≡C',
      formula: 'C2H2',
      stability: 0.64,
      atoms: [
        atom('c1', 'C', c1.x, c1.y),
        atom('c2', 'C', c2.x, c2.y),
        h('h1', c1, 180),
        h('h2', c2, 0),
      ],
      bonds: [
        bond('b1', 'c1', 'c2', 3),
        bond('b2', 'c1', 'h1'),
        bond('b3', 'c2', 'h2'),
      ],
    };
  })(),
  (() => {
    const c1 = { x: 220, y: 220 };
    const c2 = { x: 300, y: 220 };
    const c3 = { x: 380, y: 220 };
    return {
      name: 'Propano (C₃H₈)',
      description: 'Alcano de três carbonos',
      formula: 'C3H8',
      stability: 0.75,
      atoms: [
        atom('c1', 'C', c1.x, c1.y),
        atom('c2', 'C', c2.x, c2.y),
        atom('c3', 'C', c3.x, c3.y),
        h('h1', c1, -90), h('h2', c1, 180), h('h3', c1, 90),
        h('h4', c2, -90), h('h5', c2, 90),
        h('h6', c3, -90), h('h7', c3, 0), h('h8', c3, 90),
      ],
      bonds: [
        bond('b1', 'c1', 'c2'),
        bond('b2', 'c2', 'c3'),
        bond('b3', 'c1', 'h1'), bond('b4', 'c1', 'h2'), bond('b5', 'c1', 'h3'),
        bond('b6', 'c2', 'h4'), bond('b7', 'c2', 'h5'),
        bond('b8', 'c3', 'h6'), bond('b9', 'c3', 'h7'), bond('b10', 'c3', 'h8'),
      ],
    };
  })(),
  (() => {
    const c1 = { x: 240, y: 220 };
    const c2 = { x: 320, y: 220 };
    const o1 = { x: 400, y: 220 };
    return {
      name: 'Etanol (C₂H₆O)',
      description: 'Álcool primário CH₃CH₂OH',
      formula: 'C2H6O',
      stability: 0.6,
      atoms: [
        atom('c1', 'C', c1.x, c1.y),
        atom('c2', 'C', c2.x, c2.y),
        atom('o1', 'O', o1.x, o1.y),
        h('h1', c1, -90), h('h2', c1, 180), h('h3', c1, 90),
        h('h4', c2, -90), h('h5', c2, 90),
        h('h6', o1, 0),
      ],
      bonds: [
        bond('b1', 'c1', 'c2'),
        bond('b2', 'c2', 'o1'),
        bond('b3', 'c1', 'h1'),
        bond('b4', 'c1', 'h2'),
        bond('b5', 'c1', 'h3'),
        bond('b6', 'c2', 'h4'),
        bond('b7', 'c2', 'h5'),
        bond('b8', 'o1', 'h6'),
      ],
    };
  })(),
  {
    name: 'Formaldeído (CH₂O)',
    description: 'Aldeído mais simples, H₂C=O',
    formula: 'CH2O',
    stability: 0.55,
    atoms: [
      atom('c1', 'C', 300, 220),
      atom('o1', 'O', 380, 220),
      h('h1', { x: 300, y: 220 }, -120),
      h('h2', { x: 300, y: 220 }, 120),
    ],
    bonds: [
      bond('b1', 'c1', 'o1', 2),
      bond('b2', 'c1', 'h1'),
      bond('b3', 'c1', 'h2'),
    ],
  },
  (() => {
    const c1 = { x: 220, y: 220 };
    const c2 = { x: 300, y: 220 };
    const o1 = { x: 380, y: 180 };
    const o2 = { x: 380, y: 260 };
    return {
      name: 'Ácido Acético (CH₃COOH)',
      description: 'Ácido carboxílico do vinagre',
      formula: 'C2H4O2',
      stability: 0.65,
      atoms: [
        atom('c1', 'C', c1.x, c1.y),
        atom('c2', 'C', c2.x, c2.y),
        atom('o1', 'O', o1.x, o1.y),
        atom('o2', 'O', o2.x, o2.y),
        h('h1', c1, -90), h('h2', c1, 90), h('h3', c1, 180),
        h('h4', o2, 45),
      ],
      bonds: [
        bond('b1', 'c1', 'c2'),
        bond('b2', 'c2', 'o1', 2),
        bond('b3', 'c2', 'o2'),
        bond('b4', 'c1', 'h1'),
        bond('b5', 'c1', 'h2'),
        bond('b6', 'c1', 'h3'),
        bond('b7', 'o2', 'h4'),
      ],
    };
  })(),
  (() => {
    const c1 = { x: 220, y: 220 };
    const c2 = { x: 300, y: 220 };
    const c3 = { x: 380, y: 220 };
    const o1 = { x: 300, y: 140 };
    return {
      name: 'Acetona (C₃H₆O)',
      description: 'Cetona simples, CH₃COCH₃',
      formula: 'C3H6O',
      stability: 0.58,
      atoms: [
        atom('c1', 'C', c1.x, c1.y),
        atom('c2', 'C', c2.x, c2.y),
        atom('c3', 'C', c3.x, c3.y),
        atom('o1', 'O', o1.x, o1.y),
        h('h1', c1, -90), h('h2', c1, 180), h('h3', c1, 90),
        h('h4', c3, -90), h('h5', c3, 0), h('h6', c3, 90),
      ],
      bonds: [
        bond('b1', 'c1', 'c2'),
        bond('b2', 'c2', 'c3'),
        bond('b3', 'c2', 'o1', 2),
        bond('b4', 'c1', 'h1'),
        bond('b5', 'c1', 'h2'),
        bond('b6', 'c1', 'h3'),
        bond('b7', 'c3', 'h4'),
        bond('b8', 'c3', 'h5'),
        bond('b9', 'c3', 'h6'),
      ],
    };
  })(),
  (() => {
    const cx = 310, cy = 230, r = 75;
    const carbons = Array.from({ length: 6 }, (_, i) => {
      const angle = (i * 60 - 90) * Math.PI / 180;
      return atom(
        `c${i + 1}`,
        'C',
        Math.round(cx + r * Math.cos(angle)),
        Math.round(cy + r * Math.sin(angle))
      );
    });
    const hydrogens = carbons.map((c, i) => h(`h${i + 1}`, c, i * 60 - 90));
    const ringBonds = carbons.map((c, i) =>
      bond(`b${i + 1}`, c.id, carbons[(i + 1) % 6].id, i % 2 === 0 ? 2 : 1)
    );
    const hBonds = carbons.map((c, i) => bond(`bh${i + 1}`, c.id, `h${i + 1}`));
    return {
      name: 'Benzeno (C₆H₆)',
      description: 'Anel aromático representado em forma de Kekulé',
      formula: 'C6H6',
      stability: 0.88,
      atoms: [...carbons, ...hydrogens],
      bonds: [...ringBonds, ...hBonds],
    };
  })(),
  (() => {
    const atoms: Atom[] = [];
    const bonds: BondWithOrder[] = [];
    const carbonPositions = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i + 1}`,
      x: 130 + i * 78,
      y: 220 + (i % 2 === 0 ? -18 : 18),
    }));

    carbonPositions.forEach((c) => atoms.push(atom(c.id, 'C', c.x, c.y)));
    for (let i = 1; i < carbonPositions.length; i++) {
      bonds.push(bond(`bc${i}`, `c${i}`, `c${i + 1}`));
    }

    atoms.push(atom('o1', 'O', 70, 170));
    atoms.push(h('h_c1', carbonPositions[0], 120));
    bonds.push(bond('b_c1_o1', 'c1', 'o1', 2));
    bonds.push(bond('b_c1_h', 'c1', 'h_c1'));

    for (let i = 2; i <= 5; i++) {
      const c = carbonPositions[i - 1];
      const ohUp = i % 2 === 0;
      const oxygenId = `o${i}`;
      const oxygen = atom(oxygenId, 'O', c.x, c.y + (ohUp ? -58 : 58));
      atoms.push(oxygen);
      atoms.push(h(`h_c${i}`, c, ohUp ? 80 : -80));
      atoms.push(h(`h_o${i}`, oxygen, ohUp ? -90 : 90));
      bonds.push(bond(`b_c${i}_o`, `c${i}`, oxygenId));
      bonds.push(bond(`b_c${i}_h`, `c${i}`, `h_c${i}`));
      bonds.push(bond(`b_o${i}_h`, oxygenId, `h_o${i}`));
    }

    const c6 = carbonPositions[5];
    const o6 = atom('o6', 'O', c6.x + 58, c6.y + 54);
    atoms.push(o6);
    atoms.push(h('h_c6a', c6, -70));
    atoms.push(h('h_c6b', c6, 80));
    atoms.push(h('h_o6', o6, 45));
    bonds.push(bond('b_c6_o6', 'c6', 'o6'));
    bonds.push(bond('b_c6_h1', 'c6', 'h_c6a'));
    bonds.push(bond('b_c6_h2', 'c6', 'h_c6b'));
    bonds.push(bond('b_o6_h', 'o6', 'h_o6'));

    return {
      name: 'Glicose aberta (C₆H₁₂O₆)',
      description: 'Aldohexose em cadeia aberta, sem estereoquímica 3D',
      formula: 'C6H12O6',
      stability: 0.5,
      atoms,
      bonds,
    };
  })(),
  {
    name: 'Ácido Clorídrico (HCl)',
    description: 'Molécula diatômica polar H-Cl',
    formula: 'HCl',
    stability: 0.8,
    atoms: [
      atom('cl1', 'Cl', 300, 220),
      h('h1', { x: 300, y: 220 }, 180),
    ],
    bonds: [
      bond('b1', 'cl1', 'h1'),
    ],
  },
  {
    name: 'Nitroglicerina (C₃H₅N₃O₉)',
    description: 'Explosivo potente, tri-éster do ácido nítrico com glicerol',
    formula: 'C3H5N3O9',
    stability: 0.35,
    atoms: [
      // Oxigênio ligado ao N1
      atom('o1', 'O', 363, 427),
      // Nitrogênio central 1 com ligação dupla O
      atom('n1', 'N', 403, 358),
      // Oxigênio dupla ligado ao N1
      atom('o2', 'O', 483, 358),
      // Oxigênio simples ligado ao N1 (ponte para C1)
      atom('o3', 'O', 363, 289),
      // Carbono 1 (CH)
      atom('c1', 'C', 403, 220),
      // Carbono 2 (CH2)
      atom('c2', 'C', 363, 151),
      // Oxigênio ponte C2-N2
      atom('o4', 'O', 283, 151),
      // Nitrogênio 2
      atom('n2', 'N', 243, 82),
      // Oxigênio dupla N2
      atom('o5', 'O', 163, 82),
      // Carbono 3 (CH2)
      atom('c3', 'C', 403, 82),
      // Oxigênio ponte C3-N3
      atom('o6', 'O', 363, 13),
      // Nitrogênio 3
      atom('n3', 'N', 403, -56),
      // Oxigênio dupla N3
      atom('o7', 'O', 483, -56),
      // Oxigênio dupla N3 (segundo O)
      atom('o8', 'O', 363, -125),
      // Oxigênio dupla N2 (segundo O)
      atom('o9', 'O', 283, 13),
    ],
    bonds: [
      // N1 com dois O dupla
      bond('b1', 'o1', 'n1', 2),
      bond('b2', 'n1', 'o2', 2),
      // N1-O3 simples (ponte)
      bond('b3', 'n1', 'o3', 1),
      // O3-C1
      bond('b4', 'o3', 'c1', 1),
      // C1-C2
      bond('b5', 'c1', 'c2', 1),
      // C2-O4
      bond('b6', 'c2', 'o4', 1),
      // O4-N2
      bond('b7', 'o4', 'n2', 1),
      // N2 com dois O dupla
      bond('b8', 'n2', 'o5', 2),
      bond('b14', 'n2', 'o9', 2),
      // C2-C3
      bond('b9', 'c2', 'c3', 1),
      // C3-O6
      bond('b10', 'c3', 'o6', 1),
      // O6-N3
      bond('b11', 'o6', 'n3', 1),
      // N3 com dois O dupla
      bond('b12', 'n3', 'o7', 2),
      bond('b13', 'n3', 'o8', 2),
    ],
  },
  {
    name: 'TNT (C₇H₅N₃O₆)',
    description: 'Trinitrotolueno, explosivo estável com anel aromático',
    formula: 'C7H5N3O6',
    stability: 0.72,
    atoms: [
      // Anel benzênico - Carbonos
      atom('c1', 'C', 300, 180),  // C com CH3 (posição 1)
      atom('c2', 'C', 360, 210),  // C com NO2 (posição 2)
      atom('c3', 'C', 360, 270),  // C com H (posição 3)
      atom('c4', 'C', 300, 300),  // C com NO2 (posição 4)
      atom('c5', 'C', 240, 270),  // C com H (posição 5)
      atom('c6', 'C', 240, 210),  // C com NO2 (posição 6)
      
      // Grupo metil (CH3) no carbono 1
      atom('c7', 'C', 300, 120),
      
      // Hidrogênios do grupo metil
      h('h1a', { x: 300, y: 120 }, -60),
      h('h1b', { x: 300, y: 120 }, 60),
      h('h1c', { x: 300, y: 120 }, 180),
      
      // Hidrogênios do anel (posições 3 e 5)
      h('h3', { x: 360, y: 270 }, 90),
      h('h5', { x: 240, y: 270 }, -90),
      
      // Grupo NO2 no carbono 2
      atom('n2', 'N', 420, 190),
      atom('o2a', 'O', 460, 160),
      atom('o2b', 'O', 460, 220),
      
      // Grupo NO2 no carbono 4
      atom('n4', 'N', 300, 360),
      atom('o4a', 'O', 340, 400),
      atom('o4b', 'O', 260, 400),
      
      // Grupo NO2 no carbono 6
      atom('n6', 'N', 180, 190),
      atom('o6a', 'O', 140, 160),
      atom('o6b', 'O', 140, 220),
    ],
    bonds: [
      // Ligações do anel benzênico (alternando duplas)
      bond('b1', 'c1', 'c2', 2),
      bond('b2', 'c2', 'c3', 1),
      bond('b3', 'c3', 'c4', 2),
      bond('b4', 'c4', 'c5', 1),
      bond('b5', 'c5', 'c6', 2),
      bond('b6', 'c6', 'c1', 1),
      
      // Grupo metil
      bond('b7', 'c1', 'c7', 1),
      bond('b8', 'c7', 'h1a', 1),
      bond('b9', 'c7', 'h1b', 1),
      bond('b10', 'c7', 'h1c', 1),
      
      // Hidrogênios do anel
      bond('b11', 'c3', 'h3', 1),
      bond('b12', 'c5', 'h5', 1),
      
      // NO2 no carbono 2
      bond('b13', 'c2', 'n2', 1),
      bond('b14', 'n2', 'o2a', 2),
      bond('b15', 'n2', 'o2b', 2),
      
      // NO2 no carbono 4
      bond('b16', 'c4', 'n4', 1),
      bond('b17', 'n4', 'o4a', 2),
      bond('b18', 'n4', 'o4b', 2),
      
      // NO2 no carbono 6
      bond('b19', 'c6', 'n6', 1),
      bond('b20', 'n6', 'o6a', 2),
      bond('b21', 'n6', 'o6b', 2),
    ],
  }
];
