# 🔬 Laboratório Molecular — Ilum Escola de Ciência

Aplicação web interativa de divulgação científica desenvolvida para a **Ilum — Escola de Ciência**, permitindo que visitantes construam moléculas e simulem sua estabilidade térmica em um ambiente lúdico e didático.

Projetada para **totens de eventos**, **tablets** e **dispositivos móveis**, a experiência visa despertar curiosidade científica no público geral e estudantes de ensino médio.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Funcionalidades

### 🧱 Construtor Molecular 2D Assistido
- Construção livre com átomos de **C, H, O, N, S, P, F, Cl e Br**
- Ligações automáticas baseadas em **regras de valência**
- Preenchimento automático de **hidrogênios implícitos**
- **Ghost previews** — visualização prévia das posições candidatas antes de inserir
- Indicadores visuais de **valência restante** por átomo
- Suporte a **ligações simples, duplas e triplas**

### 🧭 Navegação no Canvas
- **Pan** (arrastar) e **Zoom** (0.3x–3x) via mouse wheel e gestos touch
- Grade infinita de fundo para orientação espacial
- Botões de **centralizar** e **ajustar ao conteúdo**
- Cinco modos de ferramenta: Selecionar, Adicionar, Mover, Apagar e Navegar

### 🧪 Simulação Térmica
- Animação de vibração molecular com intensidade crescente
- Efeitos de partículas, pulsação de ligações e brilho energético
- Resultado visual de **estabilidade** ou **ruptura** da molécula
- Enquadramento automático (fit-to-screen) — molécula nunca aparece cortada

### 📦 Galeria de Moléculas Prontas
- Moléculas pré-configuradas prontas para carregar e editar
- Inclui: Água, Metano, Amônia, CO₂, Etanol, Benzeno, Ácido Acético, Glicose, Cafeína e mais
- Barra lateral com scroll interno e organização visual

### ⚙️ Painel Administrativo
- Controle de intensidade da simulação
- Forçar resultado (estável / ruptura / automático)
- Mensagens customizáveis de resultado
- Modo evento ou demonstração

---

## 🚀 Como rodar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+ ou [Bun](https://bun.sh/)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/laboratorio-molecular.git
cd laboratorio-molecular

# Instale as dependências
npm install
# ou
bun install
```

Crie um arquivo `.env.local` na raiz do projeto apontando para o backend:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Depois inicie o servidor de desenvolvimento:

```bash
# Inicie o servidor de desenvolvimento
npm run dev
# ou
bun dev
```

A aplicação estará disponível em `http://localhost:5173`.

### Build de produção

```bash
npm run build
npm run preview
```

---

## 🛠️ Stack Tecnológica

| Tecnologia | Uso |
|---|---|
| **React 18** | Interface de usuário |
| **TypeScript 5** | Tipagem estática |
| **Vite 5** | Bundler e dev server |
| **Tailwind CSS 3** | Estilização utilitária |
| **shadcn/ui** | Componentes de UI |
| **Lucide React** | Ícones |
| **React Router** | Roteamento SPA |

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── builder/          # Componentes do editor molecular
│   │   ├── AtomPalette   # Paleta de átomos disponíveis
│   │   ├── BuilderCanvas # Canvas SVG interativo
│   │   ├── BuilderToolbar# Barra de ferramentas
│   │   └── PresetsPanel  # Galeria de moléculas prontas
│   └── ui/               # Componentes shadcn/ui
├── context/
│   └── ExperienceContext  # Estado global da experiência
├── data/
│   └── presetMolecules    # Definições de moléculas prontas
├── hooks/
│   └── useMoleculeBuilder # Lógica do construtor
├── lib/
│   └── moleculeEngine     # Motor de regras moleculares
├── screens/
│   ├── LandingScreen      # Tela inicial
│   ├── BuilderScreen      # Tela de construção
│   ├── SimulationScreen   # Tela de simulação
│   └── ExplanationScreen  # Tela de resultado
└── pages/
    └── Index              # Roteador principal
```

---

## 🎓 Sobre a Ilum

A [Ilum — Escola de Ciência](https://ilum.cnpem.br/) é uma instituição de ensino superior vinculada ao CNPEM (Centro Nacional de Pesquisa em Energia e Materiais), dedicada à formação interdisciplinar em ciências naturais.

---

## 📄 Licença

Este projeto é de uso educacional e institucional da Ilum — Escola de Ciência.
