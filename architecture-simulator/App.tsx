import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, StepForward, Terminal, Cpu as CpuIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { CodeEditor } from './components/CodeEditor';
import { Visualizer } from './components/Visualizer';
import { parseAssembly, INITIAL_CODE } from './services/assembler';
import { CpuState, CpuStage, OpCode, ControlSignals, ViewMode } from './types';

// Helper to determine control signals based on Instruction Binary (Truth Table 10)
const decodeControlSignals = (binary: string): ControlSignals => {
  const bit15 = binary[0] === '1';
  const bit14 = binary[1] === '1';
  const bit13 = binary[2] === '1';
  const bit9 = binary[6] === '1';

  return {
    PL: bit15 && bit14,
    JB: bit13,
    MB: bit15,
    MD: bit13,
    MW: bit14 && !bit15,
    RW: !bit14,
    BC: bit9
  };
};

const getInitialState = (): CpuState => ({
  registers: Array(8).fill(0),
  pc: 0,
  dataMemory: {},
  instructionMemory: [],
  currentStage: CpuStage.FETCH,
  activeSignals: [],
  controlSignals: { MB: false, MD: false, RW: false, MW: false, PL: false, JB: false, BC: false },
  aluResult: 0,
  currentInstructionIndex: 0,
  isRunning: false,
  clockSpeed: 1000,
  viewMode: ViewMode.MACRO,
  microStep: 0,
  focusedComponent: null
});

const App: React.FC = () => {
  const [code, setCode] = useState(INITIAL_CODE);
  const [cpuState, setCpuState] = useState<CpuState>(getInitialState());

  // Load Instructions
  useEffect(() => {
    const instructions = parseAssembly(code);
    setCpuState(prev => ({ ...prev, instructionMemory: instructions }));
  }, [code]);

  const resetSimulation = () => {
    const freshState = getInitialState();
    freshState.instructionMemory = parseAssembly(code);
    setCpuState(freshState);
  };

  const performFetch = (state: CpuState): Partial<CpuState> => {
    if (state.pc >= state.instructionMemory.length) {
      return { isRunning: false };
    }
    return {
      currentStage: CpuStage.DECODE,
      currentInstructionIndex: state.pc,
      activeSignals: ['pc-mem', 'mem-dec', 'mem-ext'],
      microStep: 0
    };
  };

  const performDecode = (state: CpuState): Partial<CpuState> => {
    const instr = state.instructionMemory[state.currentInstructionIndex];
    const signals = decodeControlSignals(instr.binary);

    return {
      currentStage: CpuStage.EXECUTE,
      controlSignals: signals,
      activeSignals: ['dec-reg-rw', 'dec-mux-b', 'dec-alu', 'dec-mem-mw'],
      microStep: 0
    };
  };

  const performExecute = (state: CpuState): Partial<CpuState> => {
    const instr = state.instructionMemory[state.currentInstructionIndex];
    let result = 0;
    
    switch (instr.opCode) {
      case OpCode.ADD: result = (state.registers[instr.src1!] || 0) + (state.registers[instr.src2!] || 0); break;
      case OpCode.SUB: result = (state.registers[instr.src1!] || 0) - (state.registers[instr.src2!] || 0); break;
      case OpCode.ADDI: result = (state.registers[instr.src1!] || 0) + (instr.immediate || 0); break;
      case OpCode.LDI:
      case OpCode.MOV: result = instr.immediate || 0; break;
      case OpCode.AND: result = (state.registers[instr.src1!] || 0) & (state.registers[instr.src2!] || 0); break;
      case OpCode.LOAD: result = (state.registers[instr.src1!] || 0); break;
      case OpCode.STORE: result = (state.registers[instr.src1!] || 0); break;
      case OpCode.BRZ: result = (state.registers[instr.src1!] || 0); break;
      default: result = 0;
    }

    return {
      currentStage: CpuStage.WRITE_BACK,
      aluResult: result,
      activeSignals: ['reg-alu-a', 'reg-mux-b', 'mux-b-alu', 'alu-out'],
      microStep: 0
    };
  };

  const performWriteBack = (state: CpuState): Partial<CpuState> => {
    const instr = state.instructionMemory[state.currentInstructionIndex];
    const nextRegisters = [...state.registers];
    const nextDataMem = { ...state.dataMemory };
    let nextPc = state.pc + 1;

    if (state.controlSignals.MW) {
       const val = state.registers[instr.src2!]; 
       const addr = state.aluResult;
       nextDataMem[addr] = val;
    }

    if (state.controlSignals.RW) {
      let writeData = state.aluResult;
      if (state.controlSignals.MD) {
        writeData = state.dataMemory[state.aluResult] || 0;
      }
      if (instr.dest !== null) {
        nextRegisters[instr.dest] = writeData;
      }
    }

    if (state.controlSignals.PL) {
      if (state.controlSignals.JB) {
         nextPc = state.registers[instr.src1!] || 0;
      } else {
         if (state.aluResult === 0) {
            nextPc = state.pc + (instr.address || 0);
         }
      }
    }

    return {
      currentStage: CpuStage.FETCH,
      registers: nextRegisters,
      dataMemory: nextDataMem,
      pc: nextPc,
      activeSignals: ['mux-d-reg', 'mem-mux-d'],
      microStep: 0
    };
  };

  const stepSimulation = useCallback(() => {
    setCpuState(prev => {
      // Logic for Detailed View Micro-Stepping
      if (prev.viewMode === ViewMode.MICRO && !prev.focusedComponent) {
         const limits = {
            [CpuStage.FETCH]: 2,
            [CpuStage.DECODE]: 3,
            [CpuStage.EXECUTE]: 2,
            [CpuStage.WRITE_BACK]: 2
         };
         
         if (prev.microStep < limits[prev.currentStage]) {
            return { ...prev, microStep: prev.microStep + 1 };
         }
         // If micro-step complete, proceed to next stage logic below (which resets microStep)
      }

      // Normal Stage Progression
      let changes: Partial<CpuState> = {};
      switch (prev.currentStage) {
        case CpuStage.FETCH: changes = performFetch(prev); break;
        case CpuStage.DECODE: changes = performDecode(prev); break;
        case CpuStage.EXECUTE: changes = performExecute(prev); break;
        case CpuStage.WRITE_BACK: changes = performWriteBack(prev); break;
      }
      return { ...prev, ...changes };
    });
  }, []);

  const handleStepInto = () => {
    setCpuState(prev => ({ ...prev, viewMode: ViewMode.MICRO, microStep: 0, focusedComponent: null }));
  };

  const handleStepOut = () => {
    setCpuState(prev => ({ ...prev, viewMode: ViewMode.MACRO, focusedComponent: null }));
  };

  const handleFocusComponent = (component: string) => {
     setCpuState(prev => ({ 
       ...prev, 
       viewMode: ViewMode.MICRO, 
       focusedComponent: component,
       microStep: 0 
     }));
  };

  // Auto-run loop
  useEffect(() => {
    let interval: any;
    if (cpuState.isRunning) {
      interval = setInterval(stepSimulation, cpuState.clockSpeed);
    }
    return () => clearInterval(interval);
  }, [cpuState.isRunning, stepSimulation, cpuState.clockSpeed]);

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-amber-500/30">
      
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-amber-400 to-orange-600 p-2 rounded-lg shadow-lg shadow-amber-500/20">
            <CpuIcon className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">NEXUS <span className="text-amber-500">CORE</span></h1>
            <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Harvard Architecture Simulator</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {/* Stage Indicator */}
           <div className="flex items-center bg-slate-900 rounded-full px-4 py-1.5 border border-slate-800">
             {Object.values(CpuStage).map((stage, idx) => (
               <div key={stage} className="flex items-center">
                 {idx > 0 && <div className="w-4 h-0.5 bg-slate-800 mx-2"></div>}
                 <span className={`text-xs font-bold transition-colors duration-300 ${cpuState.currentStage === stage ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-slate-600'}`}>
                   {stage}
                 </span>
               </div>
             ))}
           </div>
        </div>
      </header>

      <main className="p-6 h-[calc(100vh-64px)] grid grid-cols-12 gap-6">
        
        {/* Left Panel: Editor & Controls */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 h-full">
           
           {/* Control Deck */}
           <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 flex flex-col gap-4 shadow-lg">
             {/* Primary Transport Controls */}
             <div className="flex justify-between items-center">
               <div className="flex gap-2">
                  <button 
                    onClick={() => setCpuState(p => ({ ...p, isRunning: !p.isRunning }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${cpuState.isRunning ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                  >
                    <Play size={16} className={cpuState.isRunning ? "animate-pulse" : ""} />
                    {cpuState.isRunning ? 'PAUSE' : 'RUN'}
                  </button>
                  <button 
                    onClick={stepSimulation}
                    disabled={cpuState.isRunning}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold transition-all border border-slate-700"
                  >
                    <StepForward size={16} />
                    STEP
                  </button>
               </div>
               <button 
                  onClick={resetSimulation}
                  className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Reset Simulation"
               >
                  <RotateCcw size={20} />
               </button>
             </div>

             {/* Debugger Controls */}
             <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleStepInto}
                  disabled={cpuState.viewMode === ViewMode.MICRO}
                  className="flex items-center justify-center gap-2 py-2 rounded bg-slate-800 border border-slate-700 text-xs font-mono hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                   <ZoomIn size={14} /> STEP INTO
                </button>
                <button
                  onClick={handleStepOut}
                  disabled={cpuState.viewMode === ViewMode.MACRO}
                  className="flex items-center justify-center gap-2 py-2 rounded bg-slate-800 border border-slate-700 text-xs font-mono hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                   <ZoomOut size={14} /> STEP OUT
                </button>
             </div>
           </div>

           {/* Editor */}
           <div className="flex-1 min-h-0">
             <CodeEditor 
                code={code} 
                onChange={setCode} 
                highlightLine={cpuState.currentInstructionIndex}
             />
           </div>
           
           {/* Quick Register View */}
           <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-hidden">
             <div className="flex items-center gap-2 mb-3 text-slate-400 text-xs uppercase font-bold tracking-wider">
               <Terminal size={14} /> Registers
             </div>
             <div className="grid grid-cols-4 gap-2">
               {cpuState.registers.map((val, i) => (
                 <div key={i} className="bg-slate-900 p-2 rounded border border-slate-800 flex flex-col items-center">
                   <span className="text-[10px] text-slate-500">R{i}</span>
                   <span className={`font-mono font-bold text-sm ${cpuState.currentStage === CpuStage.WRITE_BACK && cpuState.instructionMemory[cpuState.currentInstructionIndex]?.dest === i ? 'text-amber-400' : 'text-cyan-400'}`}>
                     {val}
                   </span>
                 </div>
               ))}
             </div>
           </div>

        </div>

        {/* Right Panel: Visualization */}
        <div className="col-span-12 lg:col-span-8 h-full flex flex-col">
          <Visualizer 
            state={cpuState} 
            onSetView={(mode) => setCpuState(prev => ({...prev, viewMode: mode, microStep: 0, focusedComponent: null}))}
            onFocusComponent={handleFocusComponent}
          />
        </div>

      </main>
    </div>
  );
};

export default App;