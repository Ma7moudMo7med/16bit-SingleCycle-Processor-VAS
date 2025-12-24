import { Instruction, OpCode } from '../types';

// Helper to convert number to binary string of specific length
const toBin = (num: number, len: number): string => {
  let binary = (num >>> 0).toString(2);
  while (binary.length < len) {
    binary = '0' + binary;
  }
  return binary.slice(-len);
};

// Opcode mappings from PDF Table 8 & 9
const OP_CODES_BIN: Record<string, string> = {
  [OpCode.ADD]:  '0000010',
  [OpCode.SUB]:  '0000101',
  [OpCode.AND]:  '0001000',
  [OpCode.OR]:   '0001001',
  [OpCode.ADDI]: '1000010',
  [OpCode.LDI]:  '1001100',
  [OpCode.LOAD]: '0010000', // LD
  [OpCode.STORE]:'0100000', // ST
  [OpCode.BRZ]:  '1100000',
  [OpCode.JMP]:  '1110000',
  [OpCode.MOV]:  '1001100', // Mapping MOV to LDI for simplicity in this sim if immediate, or MOVA if reg-reg
  [OpCode.NOP]:  '0000000',
};

export const parseAssembly = (code: string): Instruction[] => {
  const lines = code.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith(';'));
  
  return lines.map((line, index) => {
    const parts = line.trim().replace(/,/g, '').split(/\s+/);
    const op = parts[0].toUpperCase() as OpCode;
    
    // Default structure
    const instr: Instruction = {
      id: `inst-${index}`,
      raw: line,
      opCode: op,
      dest: null,
      src1: null,
      src2: null,
      immediate: null,
      address: null,
      binary: '0000000000000000'
    };

    const parseReg = (s: string) => parseInt(s.replace(/R/i, ''), 10) || 0;
    const parseImm = (s: string) => parseInt(s, 10) || 0;

    let binOp = OP_CODES_BIN[op] || '0000000';
    let binDR = '000';
    let binSA = '000';
    let binSB = '000'; // Or Operand/Address

    try {
      switch (op) {
        case OpCode.ADD:
        case OpCode.SUB:
        case OpCode.AND:
        case OpCode.OR:
          // ADD R1, R2, R3 (Dest, Src1, Src2)
          if (parts[1]) { instr.dest = parseReg(parts[1]); binDR = toBin(instr.dest, 3); }
          if (parts[2]) { instr.src1 = parseReg(parts[2]); binSA = toBin(instr.src1, 3); }
          if (parts[3]) { instr.src2 = parseReg(parts[3]); binSB = toBin(instr.src2, 3); }
          break;
        case OpCode.ADDI:
        case OpCode.LDI:
          // ADDI R1, R2, 3 OR LDI R1, 5
          if (op === OpCode.ADDI) {
            instr.dest = parseReg(parts[1]); binDR = toBin(instr.dest, 3);
            instr.src1 = parseReg(parts[2]); binSA = toBin(instr.src1, 3);
            instr.immediate = parseImm(parts[3]); binSB = toBin(instr.immediate, 3);
          } else {
            // LDI R1, 5
            instr.dest = parseReg(parts[1]); binDR = toBin(instr.dest, 3);
            instr.immediate = parseImm(parts[2]); binSB = toBin(instr.immediate, 3); // Using SB field for imm
            // Technically LDI format is Opcode(7) | DR(3) | OP(6) or similar, 
            // but for this sim we fit 3 bits or assume extended. 
            // PDF Table 8: LDI Format is RD, OP. Opcode 1001100.
            // Let's stick to the 3-bit slots for simplicity of binary viz or extend SB to 6 bits if needed.
            // For visualization consistency, we'll fill the last 3 bits.
          }
          break;
        case OpCode.MOV:
           // MOV R1, 5 -> Treat as LDI
           instr.dest = parseReg(parts[1]); binDR = toBin(instr.dest, 3);
           instr.immediate = parseImm(parts[2]); binSB = toBin(instr.immediate, 3);
           binOp = OP_CODES_BIN[OpCode.LDI];
           break;
        case OpCode.LOAD:
           // LD R1, R2 (Load address from R2 into R1) or LD R1, ADDR
           // Table 8: LD RD, RA. 0010000.
           instr.dest = parseReg(parts[1]); binDR = toBin(instr.dest, 3);
           instr.src1 = parseReg(parts[2]); binSA = toBin(instr.src1, 3); // Address Source
           break;
        case OpCode.STORE:
          // ST RA, RB (Store RB into Address RA)
          // Table 8: ST RA, RB. 0100000.
          instr.src1 = parseReg(parts[1]); binSA = toBin(instr.src1, 3); // Address Reg
          instr.src2 = parseReg(parts[2]); binSB = toBin(instr.src2, 3); // Data Reg
          break;
        case OpCode.BRZ:
          // BRZ RA, AD
          instr.src1 = parseReg(parts[1]); binSA = toBin(instr.src1, 3);
          instr.address = parseImm(parts[2]);
          // Address is usually split but we'll put it in the last 6 bits conceptually or just last 3 for viz
          binSB = toBin(instr.address, 3); 
          break;
        case OpCode.JMP:
          // JMP RA (Jump to address in RA? Or JMP AD?)
          // Table 8: JMP RA. 1110000. PC <- R[SA]
          instr.src1 = parseReg(parts[1]); binSA = toBin(instr.src1, 3);
          break;
        default:
          break;
      }
      
      // Construct 16-bit binary
      // 15-9 (7) | 8-6 (3) | 5-3 (3) | 2-0 (3)
      instr.binary = `${binOp}${binDR}${binSA}${binSB}`;

    } catch (e) {
      console.error(`Error parsing line: ${line}`, e);
    }
    return instr;
  });
};

export const INITIAL_CODE = `LDI R1, 5
LDI R2, 10
ADD R3, R1, R2
ADDI R4, R3, 2
SUB R5, R4, R1
ST R1, R5
LD R6, R1
BRZ R6, -2`;