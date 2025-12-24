export enum CpuStage {
  FETCH = 'FETCH',
  DECODE = 'DECODE',
  EXECUTE = 'EXECUTE',
  WRITE_BACK = 'WRITE_BACK',
}

export enum OpCode {
  ADD = 'ADD',
  SUB = 'SUB',
  AND = 'AND',
  OR = 'OR',
  ADDI = 'ADDI',
  LDI = 'LDI',
  LOAD = 'LOAD',
  STORE = 'STORE',
  JMP = 'JMP',
  BRZ = 'BRZ',
  MOV = 'MOV',
  NOP = 'NOP'
}

export enum ViewMode {
  MACRO = 'MACRO', // The Datapath Overview
  MICRO = 'MICRO', // Detailed Component View
}

export interface ControlSignals {
  MB: boolean; // Mux B (0=Reg, 1=Constant)
  MD: boolean; // Mux D (0=ALU, 1=DataMem)
  RW: boolean; // Register Write
  MW: boolean; // Memory Write
  PL: boolean; // PC Load (Jump/Branch)
  JB: boolean; // Jump(1) vs Branch(0)
  BC: boolean; // Branch Condition (0=Z, 1=N) - Simplified
}

export interface Instruction {
  id: string;
  raw: string;
  opCode: OpCode;
  dest: number | null; // Register index 0-7
  src1: number | null; // Register index 0-7
  src2: number | null; // Register index 0-7
  immediate: number | null;
  address: number | null;
  binary: string; // 16-bit binary string representation
}

export interface CpuState {
  registers: number[]; // 8 registers (R0-R7)
  pc: number; // Program Counter
  dataMemory: Record<number, number>; // Address -> Value
  instructionMemory: Instruction[];
  currentStage: CpuStage;
  activeSignals: string[]; // List of active wire IDs for visualization
  controlSignals: ControlSignals;
  aluResult: number;
  currentInstructionIndex: number;
  isRunning: boolean;
  clockSpeed: number;
  viewMode: ViewMode;
  microStep: number; // For stepping within a detailed view
  focusedComponent: string | null; // Tracks which specific component is being inspected (e.g., 'REGISTERS')
}

export interface ThemeColors {
  primary: string; 
  secondary: string;
  background: string;
  wireInactive: string;
  wireActive: string;
  text: string;
}