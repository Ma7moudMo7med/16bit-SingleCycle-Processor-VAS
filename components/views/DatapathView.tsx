import React from 'react';
import { CpuState, CpuStage, ControlSignals, ViewMode, Instruction, OpCode } from '../../types';
import { Wire } from '../Wire';
import { CpuComponent } from '../CpuComponent';
import { Cpu, Calculator, Save, Layers, GitBranch, Database } from 'lucide-react';

interface DatapathViewProps {
  state: CpuState;
  onComponentClick: (component: string) => void;
}

export const DatapathView: React.FC<DatapathViewProps> = ({ state, onComponentClick }) => {
  const { currentStage, registers, pc, instructionMemory, currentInstructionIndex, aluResult, activeSignals, controlSignals } = state;
  
  const fallbackInstruction: Instruction = {
    id: 'nop',
    raw: 'NOP',
    opCode: OpCode.NOP,
    dest: null,
    src1: null,
    src2: null,
    immediate: null,
    address: null,
    binary: '0000000000000000'
  };

  const currentInstr = instructionMemory[currentInstructionIndex] || fallbackInstruction;

  const isFetch = currentStage === CpuStage.FETCH;
  const isDecode = currentStage === CpuStage.DECODE;
  const isExecute = currentStage === CpuStage.EXECUTE;
  const isWriteBack = currentStage === CpuStage.WRITE_BACK;

  return (
    <div className="relative w-full h-[600px] select-none bg-slate-950 rounded-lg overflow-hidden border border-slate-900">
      
      {/* --- SVG WIRE LAYER --- */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
          </marker>
        </defs>

        <Wire id="pc-mem" d="M 120 80 L 180 80" isActive={isFetch} />
        <Wire id="mem-dec" d="M 280 80 L 320 80 L 320 250 L 350 250" isActive={isFetch} />
        <Wire id="mem-ext" d="M 320 150 L 400 150" isActive={isFetch} color="#94a3b8" />
        <Wire id="dec-reg-rw" d="M 450 300 L 480 300 L 480 200 L 520 200" isActive={isDecode && controlSignals.RW} label="RW" />
        <Wire id="dec-mux-b" d="M 450 320 L 680 320 L 680 270" isActive={isDecode && controlSignals.MB} label="MB" />
        <Wire id="dec-alu" d="M 450 340 L 760 340 L 760 370" isActive={isDecode} label="FS" />
        <Wire id="dec-mem-mw" d="M 450 360 L 920 360 L 920 320" isActive={isDecode && controlSignals.MW} label="MW" />
        <Wire id="reg-alu-a" d="M 640 120 L 720 120 L 720 380" isActive={isExecute} label="Bus A" />
        <Wire id="reg-mux-b" d="M 640 160 L 660 160 L 660 220" isActive={isExecute} label="Bus B" />
        <Wire id="mux-b-alu" d="M 700 245 L 800 245 L 800 380" isActive={isExecute} />
        <Wire id="alu-out" d="M 760 480 L 760 520 L 860 520 L 860 480" isActive={isWriteBack || isExecute} label="ALU F" />
        <Wire id="alu-mem" d="M 860 520 L 920 520 L 920 320" isActive={isExecute && controlSignals.MW} />
        <Wire id="mem-mux-d" d="M 980 200 L 980 500 L 900 500" isActive={isWriteBack && controlSignals.MD} />
        <Wire id="mux-d-reg" d="M 880 460 L 880 420 L 580 420 L 580 250" isActive={isWriteBack} label="Bus D" />
      </svg>


      {/* --- COMPONENTS LAYER --- */}

      <div className="absolute top-[50px] left-[50px]">
        <CpuComponent title="PC" isActive={isFetch} value={pc} className="w-16 h-14" icon={<GitBranch size={16}/>} canZoom onClick={() => onComponentClick('FETCH')} />
      </div>

      <div className="absolute top-[30px] left-[180px]">
        <CpuComponent title="Instr. Memory" isActive={isFetch} className="w-24 h-24" icon={<Layers size={20}/>} canZoom onClick={() => onComponentClick('FETCH')}>
          <div className="text-[10px] text-slate-500 font-mono mt-1">{currentInstr.binary.substring(0,7)}...</div>
        </CpuComponent>
      </div>

      <div className="absolute top-[220px] left-[350px]">
        <CpuComponent 
          title="Decoder" 
          isActive={isDecode} 
          className="w-28 h-40" 
          icon={<Cpu size={28}/>}
          canZoom={true}
          onClick={() => onComponentClick('DECODE')}
          details={<span>Step Into Logic</span>}
        >
          {isDecode && (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] text-amber-500 font-mono w-full mt-2">
              <span>RW:{controlSignals.RW?1:0}</span>
              <span>MW:{controlSignals.MW?1:0}</span>
              <span>MB:{controlSignals.MB?1:0}</span>
              <span>MD:{controlSignals.MD?1:0}</span>
            </div>
          )}
        </CpuComponent>
      </div>

      <div className="absolute top-[80px] left-[520px]">
        <CpuComponent 
           title="Registers" 
           isActive={isExecute || isWriteBack} 
           className="w-32 h-40" 
           icon={<Save size={20}/>} 
           canZoom 
           onClick={() => onComponentClick('REGISTERS')}
        >
          <div className="grid grid-cols-2 gap-1 w-full text-[9px] font-mono mt-1">
             {registers.slice(0,4).map((r,i) => <div key={i} className="flex justify-between px-1 bg-slate-800/50 rounded"><span>R{i}</span><span className="text-cyan-300">{r}</span></div>)}
             <div className="col-span-2 text-center text-slate-600">...</div>
             {registers.slice(6,8).map((r,i) => <div key={i+6} className="flex justify-between px-1 bg-slate-800/50 rounded"><span>R{i+6}</span><span className="text-cyan-300">{r}</span></div>)}
          </div>
        </CpuComponent>
      </div>

      <div className="absolute top-[220px] left-[660px]">
        <CpuComponent title="MUX B" isActive={isDecode} className="w-12 h-16 rounded-md" value={controlSignals.MB ? '1' : '0'} />
      </div>

      <div className="absolute top-[380px] left-[720px]">
        <CpuComponent title="ALU" isActive={isExecute} className="w-24 h-24 clip-path-alu" icon={<Calculator size={24}/>} value={aluResult} canZoom onClick={() => onComponentClick('EXECUTE')} />
      </div>

      <div className="absolute top-[200px] left-[900px]">
        <CpuComponent title="Data Memory" isActive={isWriteBack || (isExecute && controlSignals.MW)} className="w-24 h-24" icon={<Database size={20}/>} canZoom onClick={() => onComponentClick('WRITE_BACK')} />
      </div>

      <div className="absolute top-[460px] left-[860px]">
        <CpuComponent title="MUX D" isActive={isWriteBack} className="w-12 h-16 rounded-md" value={controlSignals.MD ? '1' : '0'} />
      </div>
      
      <div className="absolute bottom-4 left-4 text-xs text-slate-500 font-mono">
         Page 24: Single-Cycle Hardwired Datapath
      </div>
    </div>
  );
};