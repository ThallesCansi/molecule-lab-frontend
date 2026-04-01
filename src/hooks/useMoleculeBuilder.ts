import { useState, useCallback, useRef } from 'react';
import { Atom } from '@/context/ExperienceContext';
import {
  BondWithOrder,
  createAtom,
  createBond,
  canBond,
  canIncreaseBondOrder,
  getRemainingValence,
  findBestPosition,
  computeImplicitHydrogens,
  organizeStructure,
  findAtomAtPosition,
} from '@/lib/moleculeEngine';

export interface BuilderState {
  atoms: Atom[];
  bonds: BondWithOrder[];
}

interface HistoryEntry {
  atoms: Atom[];
  bonds: BondWithOrder[];
}

export function useMoleculeBuilder() {
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [bonds, setBonds] = useState<BondWithOrder[]>([]);
  const [activeAtomId, setActiveAtomId] = useState<string | null>(null);
  const [selectedAtomType, setSelectedAtomType] = useState('C');
  const [showHydrogens, setShowHydrogens] = useState(true);
  const [bondOrder, setBondOrder] = useState(1);
  const [valenceError, setValenceError] = useState<string | null>(null);

  // Undo / Redo
  const historyRef = useRef<HistoryEntry[]>([{ atoms: [], bonds: [] }]);
  const historyIndexRef = useRef(0);

  const pushHistory = useCallback((newAtoms: Atom[], newBonds: BondWithOrder[]) => {
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push({ atoms: newAtoms, bonds: newBonds });
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const entry = historyRef.current[historyIndexRef.current];
    setAtoms(entry.atoms);
    setBonds(entry.bonds);
    setActiveAtomId(null);
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const entry = historyRef.current[historyIndexRef.current];
    setAtoms(entry.atoms);
    setBonds(entry.bonds);
    setActiveAtomId(null);
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const clearValenceError = useCallback(() => {
    setTimeout(() => setValenceError(null), 2500);
  }, []);

  // Add atom at position, optionally linking to active atom
  const addAtom = useCallback((x: number, y: number) => {
    const newAtoms = [...atoms];
    const newBonds = [...bonds];

    let pos = { x, y };
    const activeAtom = activeAtomId ? atoms.find(a => a.id === activeAtomId) : null;

    // Snap position if we have an active atom
    if (activeAtom) {
      pos = findBestPosition(activeAtom, atoms, bonds, { x, y });
    }

    // Check if active atom can still bond
    if (activeAtom && getRemainingValence(activeAtomId!, atoms, bonds) <= 0) {
      setValenceError(`${activeAtom.symbol} já atingiu o máximo de ligações!`);
      clearValenceError();
      return;
    }

    // Check if new atom type allows bonding
    const newSymbol = selectedAtomType;
    if (activeAtom && newSymbol === 'H' && getRemainingValence(activeAtomId!, atoms, bonds) <= 0) {
      setValenceError(`Não é possível adicionar mais ligações`);
      clearValenceError();
      return;
    }

    const atom = createAtom(newSymbol, pos.x, pos.y);
    newAtoms.push(atom);

    // Auto-bond to active atom
    if (activeAtom && canBond(activeAtomId!, atom.id, newAtoms, newBonds, bondOrder)) {
      newBonds.push(createBond(activeAtomId!, atom.id, bondOrder));
    }

    setAtoms(newAtoms);
    setBonds(newBonds);
    // Set new atom as active (unless it's H which can't have more bonds)
    setActiveAtomId(newSymbol === 'H' ? activeAtomId : atom.id);
    pushHistory(newAtoms, newBonds);
  }, [atoms, bonds, activeAtomId, selectedAtomType, bondOrder, pushHistory, clearValenceError]);

  // Click on existing atom
  const clickAtom = useCallback((atomId: string) => {
    if (!activeAtomId || activeAtomId === atomId) {
      setActiveAtomId(atomId);
      return;
    }

    // Try to create bond
    if (canBond(activeAtomId, atomId, atoms, bonds, bondOrder)) {
      const newBonds = [...bonds, createBond(activeAtomId, atomId, bondOrder)];
      setBonds(newBonds);
      setActiveAtomId(atomId);
      pushHistory(atoms, newBonds);
    } else {
      // Check if bond already exists — maybe increase order
      const existing = bonds.find(
        b => (b.from === activeAtomId && b.to === atomId) || (b.from === atomId && b.to === activeAtomId)
      );
      if (existing && canIncreaseBondOrder(existing.id, atoms, bonds)) {
        const newBonds = bonds.map(b => b.id === existing.id ? { ...b, order: b.order + 1 } : b);
        setBonds(newBonds);
        setActiveAtomId(atomId);
        pushHistory(atoms, newBonds);
      } else {
        const targetAtom = atoms.find(a => a.id === atomId);
        const symbol = targetAtom?.symbol || '';
        setValenceError(`${symbol} já atingiu o número máximo de ligações`);
        clearValenceError();
        setActiveAtomId(atomId);
      }
    }
  }, [activeAtomId, atoms, bonds, bondOrder, pushHistory, clearValenceError]);

  // Delete atom
  const deleteAtom = useCallback((atomId: string) => {
    const newAtoms = atoms.filter(a => a.id !== atomId);
    const newBonds = bonds.filter(b => b.from !== atomId && b.to !== atomId);
    setAtoms(newAtoms);
    setBonds(newBonds);
    if (activeAtomId === atomId) setActiveAtomId(null);
    pushHistory(newAtoms, newBonds);
  }, [atoms, bonds, activeAtomId, pushHistory]);

  // Delete bond
  const deleteBond = useCallback((bondId: string) => {
    const newBonds = bonds.filter(b => b.id !== bondId);
    setBonds(newBonds);
    pushHistory(atoms, newBonds);
  }, [atoms, bonds, pushHistory]);

  // Move atom
  const moveAtom = useCallback((atomId: string, x: number, y: number) => {
    setAtoms(prev => prev.map(a => a.id === atomId ? { ...a, x, y } : a));
  }, []);

  const finishMove = useCallback(() => {
    pushHistory(atoms, bonds);
  }, [atoms, bonds, pushHistory]);

  // Clear all
  const clearAll = useCallback(() => {
    setAtoms([]);
    setBonds([]);
    setActiveAtomId(null);
    pushHistory([], []);
  }, [pushHistory]);

  // Complete with hydrogens (add explicit Hs)
  const completeWithHydrogens = useCallback(() => {
    const { hydrogenAtoms, hydrogenBonds } = computeImplicitHydrogens(atoms, bonds);
    const newAtoms = [...atoms, ...hydrogenAtoms];
    const newBonds = [...bonds, ...hydrogenBonds];
    setAtoms(newAtoms);
    setBonds(newBonds);
    pushHistory(newAtoms, newBonds);
  }, [atoms, bonds, pushHistory]);

  // Organize
  const organize = useCallback(() => {
    const organized = organizeStructure(atoms, bonds);
    setAtoms(organized);
    pushHistory(organized, bonds);
  }, [atoms, bonds, pushHistory]);

  // Load preset
  const loadPreset = useCallback((presetAtoms: Atom[], presetBonds: BondWithOrder[]) => {
    setAtoms(presetAtoms);
    setBonds(presetBonds);
    setActiveAtomId(null);
    pushHistory(presetAtoms, presetBonds);
  }, [pushHistory]);

  // Implicit hydrogens for display
  const implicitH = showHydrogens ? computeImplicitHydrogens(atoms, bonds) : { hydrogenAtoms: [], hydrogenBonds: [] };

  // Ghost preview position
  const getGhostPosition = useCallback((mousePos: { x: number; y: number }) => {
    if (!activeAtomId) return mousePos;
    const activeAtom = atoms.find(a => a.id === activeAtomId);
    if (!activeAtom) return mousePos;
    return findBestPosition(activeAtom, atoms, bonds, mousePos);
  }, [activeAtomId, atoms, bonds]);

  return {
    atoms,
    bonds,
    activeAtomId,
    setActiveAtomId,
    selectedAtomType,
    setSelectedAtomType,
    showHydrogens,
    setShowHydrogens,
    bondOrder,
    setBondOrder,
    valenceError,
    addAtom,
    clickAtom,
    deleteAtom,
    deleteBond,
    moveAtom,
    finishMove,
    clearAll,
    completeWithHydrogens,
    organize,
    loadPreset,
    undo,
    redo,
    canUndo,
    canRedo,
    implicitH,
    getGhostPosition,
    findAtomAt: (pos: { x: number; y: number }) => findAtomAtPosition(pos, atoms),
  };
}
