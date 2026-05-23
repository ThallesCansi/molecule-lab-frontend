/**
 * moleculeApi.ts
 *
 * Camada de serviço responsável por:
 *  1. Serializar a molécula do canvas em um grafo compatível com o backend / RDKit
 *  2. Enviar e receber dados da API
 *  3. Tipar os contratos de request/response
 *
 * Formato do grafo enviado ao backend:
 *
 *   POST /api/molecule/analyze
 *   {
 *     "graph": {
 *       "atoms": [ { "id": "a1", "symbol": "C", "x": 350.0, "y": 300.0 }, ... ],
 *       "bonds": [ { "id": "b1", "from": "a1", "to": "a2", "order": 2 },   ... ]
 *     }
 *   }
 *
 * No backend (Python / RDKit), cada nó do grafo vira um atom via
 *   mol.AddAtom(Chem.Atom(symbol))
 * e cada aresta vira uma bond via
 *   mol.AddBond(idx_from, idx_to, Chem.BondType.SINGLE | .DOUBLE | .TRIPLE)
 * As coordenadas 2D são opcionalmente gravadas com
 *   AllChem.Compute2DCoords() ou com a conformação já fornecida.
 */

import { Atom } from '@/context/ExperienceContext';
import { BondWithOrder } from '@/lib/moleculeEngine';

// ---------------------------------------------------------------------------
// Tipos do grafo (request)
// ---------------------------------------------------------------------------

export interface MoleculeGraphAtom {
  /** ID único do átomo (mesmo id interno do canvas) */
  id: string;
  /** Símbolo do elemento químico, e.g. "C", "O", "N" */
  symbol: string;
  /** Coordenada X em pixels no canvas (opcional; auxilia o backend a preservar o layout 2D) */
  x: number;
  /** Coordenada Y em pixels no canvas */
  y: number;
}

export interface MoleculeGraphBond {
  /** ID único da ligação */
  id: string;
  /** ID do átomo de origem */
  from: string;
  /** ID do átomo de destino */
  to: string;
  /**
   * Ordem da ligação:
   *   1 = simples, 2 = dupla, 3 = tripla
   * Mapeamento para RDKit:
   *   1 → Chem.BondType.SINGLE
   *   2 → Chem.BondType.DOUBLE
   *   3 → Chem.BondType.TRIPLE
   */
  order: 1 | 2 | 3;
}

export interface MoleculeGraph {
  atoms: MoleculeGraphAtom[];
  bonds: MoleculeGraphBond[];
}

export interface AnalyzeRequest {
  graph: MoleculeGraph;
}

// ---------------------------------------------------------------------------
// Tipos da resposta (response)
// ---------------------------------------------------------------------------

export interface MoleculeProperties {
  /** Número de átomos pesados (sem H implícitos) */
  num_atoms: number;
  /** Número de ligações */
  num_bonds: number;
  /** Número de anéis */
  num_rings: number;
  /** Se a molécula possui caráter aromático */
  is_aromatic: boolean;
  /** Número de doadores de H (Lipinski) */
  hbd?: number;
  /** Número de receptores de H (Lipinski) */
  hba?: number;
  /** LogP estimado (Crippen) */
  logp?: number;
}

export interface BrokenBond {
  /** Símbolo do átomo i */
  atom_i: string;
  /** Símbolo do átomo j */
  atom_j: string;
  /** Distância final da ligação em Å */
  distance: number;
  /** Distância de equilíbrio r₀ em Å */
  r0: number;
  /** Fração V/Dₑ — quão próxima da dissociação (0 a 1) */
  fraction: number;
}

export interface MoleculeAnalysis {
  /** Notação SMILES gerada pelo RDKit */
  smiles: string;
  /** Fórmula molecular, e.g. "C6H6" */
  formula: string;
  /** Nome IUPAC ou trivial (se identificado) */
  name: string | null;
  /** Massa molecular em g/mol */
  molecular_weight: number;
  /** Molécula válida quimicamente segundo o RDKit */
  valid: boolean;
  /** Resultado da simulação de dinâmica molecular */
  result: 'stable' | 'break';
  /**
   * Temperatura alvo (K) no instante em que a primeira ligação rompeu.
   * Null quando result === 'stable'.
   */
  break_temperature: number | null;
  /** Lista das ligações que romperam persistentemente */
  broken_bonds: BrokenBond[];
  /** Propriedades calculadas pelo RDKit */
  properties: MoleculeProperties;
  /** Mensagem de erro, se houver */
  error: string | null;
}

// ---------------------------------------------------------------------------
// Serialização: canvas → grafo
// ---------------------------------------------------------------------------

/**
 * Converte os átomos e ligações do canvas para o formato de grafo
 * aceito pela API / RDKit.
 *
 * Nota: `BondWithOrder.order` já é 1 | 2 | 3, então o cast é seguro.
 */
export function toMoleculeGraph(atoms: Atom[], bonds: BondWithOrder[]): MoleculeGraph {
  return {
    atoms: atoms.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      x: a.x,
      y: a.y,
    })),
    bonds: bonds.map((b) => ({
      id: b.id,
      from: b.from,
      to: b.to,
      order: Math.min(Math.max(b.order, 1), 3) as 1 | 2 | 3,
    })),
  };
}

// ---------------------------------------------------------------------------
// Configuração de ambiente
// ---------------------------------------------------------------------------

/**
 * URL base da API.
 * Em desenvolvimento, use a variável de ambiente VITE_API_BASE_URL
 * (ex.: http://localhost:8000).
 * Em produção, a variável aponta para o servidor real.
 *
 * Exemplo de .env.local:
 *   VITE_API_BASE_URL=http://localhost:8000
 */
const API_BASE =
  (import.meta as Record<string, unknown> & { env: Record<string, string> }).env
    ?.VITE_API_BASE_URL ?? '';

// ---------------------------------------------------------------------------
// Chamada principal
// ---------------------------------------------------------------------------

/**
 * Envia o grafo da molécula para o backend e retorna a análise do RDKit.
 *
 * Uso:
 *   const analysis = await analyzeMolecule(atoms, bonds);
 *
 * Em caso de erro de rede ou resposta HTTP não-ok, lança um Error
 * com mensagem descritiva.
 */
export async function analyzeMolecule(
  atoms: Atom[],
  bonds: BondWithOrder[],
): Promise<MoleculeAnalysis> {
  const graph = toMoleculeGraph(atoms, bonds);
  const payload: AnalyzeRequest = { graph };

  const response = await fetch(`${API_BASE}/api/molecule/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      detail = err?.detail ?? err?.error ?? detail;
    } catch {
      // ignora falha ao parsear o corpo do erro
    }
    throw new Error(`Erro do servidor: ${detail}`);
  }

  const data: MoleculeAnalysis = await response.json();
  return data;
}

// ---------------------------------------------------------------------------
// Helpers de apresentação
// ---------------------------------------------------------------------------

/**
 * Formata a massa molecular com 2 casas decimais + unidade.
 * Ex.: formatMW(180.156) → "180.16 g/mol"
 */
export function formatMW(mw: number): string {
  return `${mw.toFixed(2)} g/mol`;
}

/**
 * Converte a ordem numérica da ligação para texto legível.
 */
export function bondOrderLabel(order: number): string {
  return order === 1 ? 'Simples' : order === 2 ? 'Dupla' : 'Tripla';
}
