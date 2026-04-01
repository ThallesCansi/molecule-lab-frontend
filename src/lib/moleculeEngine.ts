import { Atom, Bond } from '@/context/ExperienceContext';
import { ATOM_COLORS } from '@/data/presetMolecules';

// --- Valence rules ---
export const VALENCE: Record<string, number> = { H: 1, C: 4, O: 2, N: 3 };

let _idCounter = Date.now();
export const genId = () => `a${++_idCounter}`;

export const BOND_LENGTH = 80;

// Standard angles for placement (degrees) — gives nice hex/chain geometry
const PLACEMENT_ANGLES = [0, 60, 120, 180, 240, 300, 30, 90, 150, 210, 270, 330];

export interface BondWithOrder extends Bond {
  order: number; // 1, 2, or 3
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
  const extra = 1;
  const fromAtom = atoms.find(a => a.id === bond.from);
  const toAtom = atoms.find(a => a.id === bond.to);
  if (!fromAtom || !toAtom) return false;
  const fromMax = VALENCE[fromAtom.symbol] ?? 4;
  const toMax = VALENCE[toAtom.symbol] ?? 4;
  const fromUsed = getBondCount(bond.from, bonds);
  const toUsed = getBondCount(bond.to, bonds);
  return (fromMax - fromUsed >= extra) && (toMax - toUsed >= extra);
}

// --- Geometry helpers ---
function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDeg(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
}

export function findBestPosition(
  fromAtom: Atom,
  atoms: Atom[],
  bonds: BondWithOrder[],
  targetPos?: { x: number; y: number }
): { x: number; y: number } {
  // Get existing neighbors
  const neighborAngles = bonds
    .filter(b => b.from === fromAtom.id || b.to === fromAtom.id)
    .map(b => {
      const otherId = b.from === fromAtom.id ? b.to : b.from;
      const other = atoms.find(a => a.id === otherId);
      if (!other) return 0;
      return angleDeg(fromAtom, other);
    });

  // If target position given, snap to nearest good angle
  if (targetPos) {
    const rawAngle = angleDeg(fromAtom, targetPos);
    // Find best angle that doesn't overlap with existing neighbors
    let bestAngle = rawAngle;
    let bestScore = -Infinity;

    for (const candidateAngle of generateCandidateAngles(neighborAngles)) {
      // Score: prefer angles close to where user clicked, but away from existing bonds
      const clickProximity = -Math.abs(normalizeAngle(candidateAngle - rawAngle));
      const minNeighborDist = neighborAngles.length > 0
        ? Math.min(...neighborAngles.map(na => Math.abs(normalizeAngle(candidateAngle - na))))
        : 180;
      const score = clickProximity * 0.5 + minNeighborDist * 2;
      if (score > bestScore) {
        bestScore = score;
        bestAngle = candidateAngle;
      }
    }

    const rad = (bestAngle * Math.PI) / 180;
    return {
      x: Math.round(fromAtom.x + BOND_LENGTH * Math.cos(rad)),
      y: Math.round(fromAtom.y + BOND_LENGTH * Math.sin(rad)),
    };
  }

  // No target — pick best open angle
  const candidates = generateCandidateAngles(neighborAngles);
  let bestAngle = candidates[0] ?? 0;
  let bestMinDist = -1;
  for (const angle of candidates) {
    const minDist = neighborAngles.length > 0
      ? Math.min(...neighborAngles.map(na => Math.abs(normalizeAngle(angle - na))))
      : 180;
    if (minDist > bestMinDist) {
      bestMinDist = minDist;
      bestAngle = angle;
    }
  }

  const rad = (bestAngle * Math.PI) / 180;
  return {
    x: Math.round(fromAtom.x + BOND_LENGTH * Math.cos(rad)),
    y: Math.round(fromAtom.y + BOND_LENGTH * Math.sin(rad)),
  };
}

function generateCandidateAngles(existingAngles: number[]): number[] {
  if (existingAngles.length === 0) return PLACEMENT_ANGLES;
  // Generate angles evenly distributed away from existing bonds
  const candidates: number[] = [];
  for (let a = 0; a < 360; a += 30) {
    candidates.push(a);
  }
  return candidates.sort((a, b) => {
    const minDistA = Math.min(...existingAngles.map(e => Math.abs(normalizeAngle(a - e))));
    const minDistB = Math.min(...existingAngles.map(e => Math.abs(normalizeAngle(b - e))));
    return minDistB - minDistA;
  });
}

function normalizeAngle(a: number): number {
  while (a > 180) a -= 360;
  while (a < -180) a += 360;
  return a;
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

    // Get existing neighbor angles
    const existingNeighborAngles = bonds
      .filter(b => b.from === atom.id || b.to === atom.id)
      .map(b => {
        const otherId = b.from === atom.id ? b.to : b.from;
        const other = atoms.find(a => a.id === otherId);
        if (!other) return 0;
        return angleDeg(atom, other);
      });

    // Also include already placed H angles
    const allAngles = [...existingNeighborAngles];

    for (let i = 0; i < remaining; i++) {
      // Find best angle for this H
      const candidates = generateCandidateAngles(allAngles);
      const bestAngle = candidates[0] ?? (i * (360 / remaining));
      const hDist = BOND_LENGTH * 0.6;
      const rad = (bestAngle * Math.PI) / 180;

      const hId = `${atom.id}_h${i}`;
      hAtoms.push({
        id: hId,
        symbol: 'H',
        x: Math.round(atom.x + hDist * Math.cos(rad)),
        y: Math.round(atom.y + hDist * Math.sin(rad)),
        color: ATOM_COLORS.H,
      });
      hBonds.push({
        id: `${hId}_bond`,
        from: atom.id,
        to: hId,
        order: 1,
      });
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

// --- Organize structure ---
export function organizeStructure(atoms: Atom[], bonds: BondWithOrder[]): Atom[] {
  if (atoms.length === 0) return atoms;

  // Simple force-directed layout
  const positions = new Map<string, { x: number; y: number }>();
  atoms.forEach(a => positions.set(a.id, { x: a.x, y: a.y }));

  for (let iter = 0; iter < 100; iter++) {
    for (const atom of atoms) {
      if (atom.symbol === 'H') continue;
      const pos = positions.get(atom.id)!;
      let fx = 0, fy = 0;

      // Repulsion from all other non-H atoms
      for (const other of atoms) {
        if (other.id === atom.id || other.symbol === 'H') continue;
        const op = positions.get(other.id)!;
        const d = Math.max(distance(pos, op), 1);
        const force = 5000 / (d * d);
        fx += ((pos.x - op.x) / d) * force;
        fy += ((pos.y - op.y) / d) * force;
      }

      // Attraction via bonds
      const atomBonds = bonds.filter(b => b.from === atom.id || b.to === atom.id);
      for (const b of atomBonds) {
        const otherId = b.from === atom.id ? b.to : b.from;
        const otherAtom = atoms.find(a => a.id === otherId);
        if (!otherAtom || otherAtom.symbol === 'H') continue;
        const op = positions.get(otherId)!;
        const d = distance(pos, op);
        const diff = d - BOND_LENGTH;
        fx += ((op.x - pos.x) / Math.max(d, 1)) * diff * 0.1;
        fy += ((op.y - pos.y) / Math.max(d, 1)) * diff * 0.1;
      }

      positions.set(atom.id, {
        x: pos.x + fx * 0.05,
        y: pos.y + fy * 0.05,
      });
    }
  }

  // Center the molecule
  const nonH = atoms.filter(a => a.symbol !== 'H');
  const centerRef = nonH.length > 0 ? nonH : atoms;
  let cx = 0, cy = 0;
  centerRef.forEach(a => { const p = positions.get(a.id)!; cx += p.x; cy += p.y; });
  cx /= centerRef.length;
  cy /= centerRef.length;
  const offsetX = 350 - cx;
  const offsetY = 250 - cy;

  return atoms.map(a => {
    if (a.symbol === 'H') {
      // Reposition H atoms relative to their bonded atom
      const bond = bonds.find(b => b.from === a.id || b.to === a.id);
      if (bond) {
        const parentId = bond.from === a.id ? bond.to : bond.from;
        const parentPos = positions.get(parentId);
        if (parentPos) {
          // Keep same relative angle
          const origParent = atoms.find(at => at.id === parentId)!;
          const angle = angleDeg(origParent, a);
          const rad = (angle * Math.PI) / 180;
          const hDist = BOND_LENGTH * 0.6;
          return {
            ...a,
            x: Math.round(parentPos.x + offsetX + hDist * Math.cos(rad)),
            y: Math.round(parentPos.y + offsetY + hDist * Math.sin(rad)),
          };
        }
      }
    }
    const p = positions.get(a.id)!;
    return { ...a, x: Math.round(p.x + offsetX), y: Math.round(p.y + offsetY) };
  });
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
