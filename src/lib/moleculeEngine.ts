import { Atom, Bond } from '@/context/ExperienceContext';
import { ATOM_COLORS } from '@/data/presetMolecules';

// --- Valence rules ---
export const VALENCE: Record<string, number> = {
  H: 1, C: 4, O: 2, N: 5, S: 2, P: 3, F: 1, Cl: 1, Br: 1,
};

let _idCounter = Date.now();
export const genId = () => `a${++_idCounter}`;

export const BOND_LENGTH = 80;

// Preferred angles based on hybridization / neighbor count
const GEOMETRY_ANGLES: Record<number, number[]> = {
  0: [0],                          // first bond: rightward
  1: [120, -120, 180, 60, -60],    // sp3-like: ~120° from existing
  2: [120, -120, 180],             // trigonal
  3: [90, -90, 180],               // tetrahedral-ish remainder
};

export interface BondWithOrder extends Bond {
  order: number;
}

// --- Valence helpers ---
export function getBondCount(atomId: string, bonds: BondWithOrder[]): number {
  return bonds
    .filter(b => b.from === atomId || b.to === atomId)
    .reduce((sum, b) => sum + b.order, 0);
}

export function getRemainingValence(atomId: string, atoms: Atom[], bonds: BondWithOrder[]): number {
  const atom = atoms.find(a => a.id === atomId);
  if (!atom) return 0;
  const maxValence = VALENCE[atom.symbol] ?? 4;
  return Math.max(0, maxValence - getBondCount(atomId, bonds));
}

export function canBond(atomIdA: string, atomIdB: string, atoms: Atom[], bonds: BondWithOrder[], order = 1): boolean {
  if (atomIdA === atomIdB) return false;
  const existingBond = bonds.find(
    b => (b.from === atomIdA && b.to === atomIdB) || (b.from === atomIdB && b.to === atomIdA)
  );
  if (existingBond) return false;
  return getRemainingValence(atomIdA, atoms, bonds) >= order &&
         getRemainingValence(atomIdB, atoms, bonds) >= order;
}

export function canIncreaseBondOrder(bondId: string, atoms: Atom[], bonds: BondWithOrder[]): boolean {
  const bond = bonds.find(b => b.id === bondId);
  if (!bond || bond.order >= 3) return false;
  const fromAtom = atoms.find(a => a.id === bond.from);
  const toAtom = atoms.find(a => a.id === bond.to);
  if (!fromAtom || !toAtom) return false;
  const fromMax = VALENCE[fromAtom.symbol] ?? 4;
  const toMax = VALENCE[toAtom.symbol] ?? 4;
  return (fromMax - getBondCount(bond.from, bonds) >= 1) && (toMax - getBondCount(bond.to, bonds) >= 1);
}

// --- Geometry helpers ---
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDeg(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

function normalizeAngle(a: number): number {
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
}

function getNeighborAngles(atomId: string, atoms: Atom[], bonds: BondWithOrder[]): number[] {
  return bonds
    .filter(b => b.from === atomId || b.to === atomId)
    .map(b => {
      const otherId = b.from === atomId ? b.to : b.from;
      const atom = atoms.find(a => a.id === atomId)!;
      const other = atoms.find(a => a.id === otherId);
      if (!other) return 0;
      return angleDeg(atom, other);
    });
}

/**
 * Get candidate positions around an atom for placing a new bond.
 * Returns positions sorted by quality (best first).
 */
export function getCandidatePositions(
  fromAtom: Atom,
  atoms: Atom[],
  bonds: BondWithOrder[],
  count = 6
): { x: number; y: number; angle: number }[] {
  const neighborAngles = getNeighborAngles(fromAtom.id, atoms, bonds);
  const nNeighbors = neighborAngles.length;

  let candidateAngles: number[];

  if (nNeighbors === 0) {
    // No neighbors: offer a ring of angles
    candidateAngles = [0, 60, -60, 120, -120, 180];
  } else if (nNeighbors === 1) {
    // One neighbor: place at ~120° offsets from existing bond (zigzag chain)
    const existing = neighborAngles[0];
    candidateAngles = [
      existing + 120,
      existing - 120,
      existing + 180,
      existing + 60,
      existing - 60,
    ];
  } else if (nNeighbors === 2) {
    // Two neighbors: bisect the largest gap
    const sorted = [...neighborAngles].sort((a, b) => a - b);
    candidateAngles = [];
    for (let i = 0; i < sorted.length; i++) {
      const next = sorted[(i + 1) % sorted.length];
      let gap = next - sorted[i];
      if (gap <= 0) gap += 360;
      candidateAngles.push(sorted[i] + gap / 2);
    }
    // Also add opposite of each neighbor
    for (const na of neighborAngles) {
      candidateAngles.push(na + 180);
    }
  } else {
    // 3+ neighbors: find gaps
    const sorted = [...neighborAngles].sort((a, b) => a - b);
    candidateAngles = [];
    for (let i = 0; i < sorted.length; i++) {
      const next = sorted[(i + 1) % sorted.length];
      let gap = next - sorted[i];
      if (gap <= 0) gap += 360;
      if (gap > 45) {
        candidateAngles.push(sorted[i] + gap / 2);
      }
    }
    if (candidateAngles.length === 0) {
      // Fallback
      for (let a = 0; a < 360; a += 60) candidateAngles.push(a);
    }
  }

  // Score candidates: prefer those far from existing neighbors and other atoms
  const scored = candidateAngles.map(angle => {
    const rad = (angle * Math.PI) / 180;
    const x = Math.round(fromAtom.x + BOND_LENGTH * Math.cos(rad));
    const y = Math.round(fromAtom.y + BOND_LENGTH * Math.sin(rad));

    // Min angular distance from existing neighbors
    const minAngularDist = neighborAngles.length > 0
      ? Math.min(...neighborAngles.map(na => Math.abs(normalizeAngle(angle - na))))
      : 180;

    // Min spatial distance from other atoms
    const minAtomDist = atoms.length > 0
      ? Math.min(...atoms.filter(a => a.id !== fromAtom.id).map(a => distance({ x, y }, a)))
      : 999;

    const score = minAngularDist * 2 + Math.min(minAtomDist, BOND_LENGTH) * 0.5;
    return { x, y, angle, score };
  });

  // Deduplicate (close angles)
  const unique: typeof scored = [];
  for (const s of scored) {
    if (!unique.some(u => Math.abs(normalizeAngle(u.angle - s.angle)) < 15)) {
      unique.push(s);
    }
  }

  return unique
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function findBestPosition(
  fromAtom: Atom,
  atoms: Atom[],
  bonds: BondWithOrder[],
  targetPos?: { x: number; y: number }
): { x: number; y: number } {
  const candidates = getCandidatePositions(fromAtom, atoms, bonds, 12);
  
  if (!targetPos || candidates.length === 0) {
    return candidates[0] ?? { x: fromAtom.x + BOND_LENGTH, y: fromAtom.y };
  }

  // Snap to the candidate closest to where the user clicked
  let best = candidates[0];
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = distance(c, targetPos);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return { x: best.x, y: best.y };
}

// --- Auto-hydrogens ---
export function computeImplicitHydrogens(
  atoms: Atom[],
  bonds: BondWithOrder[]
): { hydrogenAtoms: Atom[]; hydrogenBonds: BondWithOrder[] } {
  const hAtoms: Atom[] = [];
  const hBonds: BondWithOrder[] = [];

  for (const atom of atoms) {
    if (atom.symbol === 'H') continue;
    const remaining = getRemainingValence(atom.id, atoms, bonds);
    if (remaining <= 0) continue;

    const existingAngles = getNeighborAngles(atom.id, atoms, bonds);
    const allAngles = [...existingAngles];

    for (let i = 0; i < remaining; i++) {
      // Find best angle away from existing
      let bestAngle = 0;
      if (allAngles.length === 0) {
        bestAngle = i * (360 / remaining) - 90;
      } else {
        // Pick angle farthest from all existing
        let bestMin = -1;
        for (let a = 0; a < 360; a += 15) {
          const minDist = Math.min(...allAngles.map(e => Math.abs(normalizeAngle(a - e))));
          if (minDist > bestMin) {
            bestMin = minDist;
            bestAngle = a;
          }
        }
      }

      const hDist = BOND_LENGTH * 0.55;
      const rad = (bestAngle * Math.PI) / 180;
      const hId = `${atom.id}_h${i}`;
      hAtoms.push({
        id: hId,
        symbol: 'H',
        x: Math.round(atom.x + hDist * Math.cos(rad)),
        y: Math.round(atom.y + hDist * Math.sin(rad)),
        color: ATOM_COLORS.H,
      });
      hBonds.push({ id: `${hId}_bond`, from: atom.id, to: hId, order: 1 });
      allAngles.push(bestAngle);
    }
  }

  return { hydrogenAtoms: hAtoms, hydrogenBonds: hBonds };
}

// --- Find atom at position ---
export function findAtomAtPosition(
  pos: { x: number; y: number },
  atoms: Atom[],
  threshold = 30
): Atom | null {
  let closest: Atom | null = null;
  let minDist = threshold;
  for (const a of atoms) {
    const d = distance(pos, a);
    if (d < minDist) {
      minDist = d;
      closest = a;
    }
  }
  return closest;
}


export function createAtom(symbol: string, x: number, y: number): Atom {
  return {
    id: genId(),
    symbol,
    x: Math.round(x),
    y: Math.round(y),
    color: ATOM_COLORS[symbol] || '#888',
  };
}

export function createBond(fromId: string, toId: string, order = 1): BondWithOrder {
  return { id: genId(), from: fromId, to: toId, order };
}
