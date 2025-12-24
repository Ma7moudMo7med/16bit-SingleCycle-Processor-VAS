import React from 'react';
import { CpuState, ControlSignals, Instruction } from '../../types';
import { Wire } from '../Wire';
import { CpuComponent } from '../CpuComponent';
import { ArrowLeft, ArrowRight, Calculator, Database, GitBranch, Layers, Save } from 'lucide-react';

interface DetailViewProps {
  state: CpuState;
  onBack: () => void;
  microStep: number;
}

// --- FETCH DETAIL VIEW ---
export const FetchDetailView: React.FC<DetailViewProps> = ({ state, onBack, microStep }) => {
  const { pc, instructionMemory, currentInstructionIndex } = state;
  const currentInstr = instructionMemory[currentInstructionIndex] || { binary: '0000000000000000' };

  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-lg overflow-hidden border border-slate-900 flex flex-col">
       <Header title="Fetch Stage: Instruction Retrieval" subtitle="Transferring from Memory to IR" onBack={onBack} />
       <div className="relative flex-1 p-8">
         <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Step 0: PC Output */}
            <Wire id="pc-addr" d="M 150 250 L 350 250" isActive={microStep >= 0} label="Address Bus" value={pc} />
            {/* Step 1: Memory Access */}
            <Wire id="mem-read" d="M 450 250 L 550 250" isActive={microStep >= 1} color="#fbbf24" />
            {/* Step 2: Instruction Out */}
            <Wire id="instr-out" d="M 650 250 L 850 250" isActive={microStep >= 2} label="Instruction Bus" value={currentInstr.binary.substring(0,8)+'...'} />
         </svg>

         <div className="absolute top-[210px] left-[50px]">
           <CpuComponent title="PC" isActive={true} value={pc} className="w-24 h-24" icon={<GitBranch size={24}/>} />
         </div>
         
         <div className="absolute top-[180px] left-[350px]">
           <CpuComponent title="Instruction Memory" isActive={microStep >= 1} className="w-64 h-40" icon={<Layers size={32}/>}>
              <div className="mt-4 font-mono text-xs text-slate-400 w-full px-4">
                 <div className="flex justify-between border-b border-slate-800 pb-1 mb-1">
                   <span>ADDR</span><span>CONTENT</span>
                 </div>
                 {[pc, pc+1, pc+2].map(addr => (
                    <div key={addr} className={`flex justify-between ${addr === pc && microStep >= 1 ? 'text-amber-400 font-bold bg-amber-900/20' : ''}`}>
                       <span>{addr}</span>
                       <span>{instructionMemory[addr] ? instructionMemory[addr].binary.substring(0,8)+'...' : '0000...'}</span>
                    </div>
                 ))}
              </div>
           </CpuComponent>
         </div>

         <div className="absolute top-[210px] left-[850px]">
           <CpuComponent title="Instr. Reg (IR)" isActive={microStep >= 2} className="w-32 h-24" value={microStep >= 2 ? currentInstr.binary.substring(0,4) + '...' : ''} />
         </div>

         <StepInfo step={microStep} steps={[
           "Program Counter (PC) sends address to Memory Bus.",
           "Instruction Memory locates data at address.",
           "Instruction word is loaded into Instruction Register (IR)."
         ]} />
       </div>
    </div>
  );
};

// --- EXECUTE DETAIL VIEW ---
export const ExecuteDetailView: React.FC<DetailViewProps> = ({ state, onBack, microStep }) => {
  const { controlSignals, registers, aluResult, instructionMemory, currentInstructionIndex } = state;
  const instr = instructionMemory[currentInstructionIndex];
  
  // Resolve inputs
  const valA = registers[instr?.src1 || 0];
  const valB_Reg = registers[instr?.src2 || 0];
  const valB_Imm = instr?.immediate || 0;
  const valB = controlSignals.MB ? valB_Imm : valB_Reg;

  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-lg overflow-hidden border border-slate-900 flex flex-col">
       <Header title="Execute Stage: ALU Operation" subtitle="Arithmetic & Logic Processing" onBack={onBack} />
       <div className="relative flex-1 p-8">
         <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
             {/* Step 0: Inputs Arrive */}
             <Wire id="bus-a" d="M 100 200 L 400 200" isActive={microStep >= 0} label="Operand A" value={valA} />
             <Wire id="bus-b-reg" d="M 100 350 L 250 350" isActive={microStep >= 0 && !controlSignals.MB} label="Reg B" value={valB_Reg} />
             <Wire id="bus-b-imm" d="M 100 420 L 250 420" isActive={microStep >= 0 && controlSignals.MB} label="Imm" value={valB_Imm} />
             
             {/* Step 1: Mux Selection */}
             <Wire id="mux-out" d="M 300 380 L 400 380" isActive={microStep >= 1} label="Operand B" value={valB} />
             
             {/* Step 2: ALU Calc */}
             <Wire id="alu-res" d="M 550 290 L 750 290" isActive={microStep >= 2} label="Result" value={aluResult} />
         </svg>

         <div className="absolute top-[180px] left-[50px] space-y-24">
             <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs text-slate-400 w-24 text-center">Register File Output A</div>
             <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs text-slate-400 w-24 text-center">Register File Output B</div>
         </div>

         <div className="absolute top-[340px] left-[250px]">
             <CpuComponent title="MUX B" isActive={microStep >= 1} className="w-16 h-24" value={controlSignals.MB ? '1' : '0'} />
         </div>

         <div className="absolute top-[180px] left-[400px]">
             <CpuComponent title="ALU" isActive={microStep >= 2} className="w-40 h-40 clip-path-alu" icon={<Calculator size={40}/>} value={microStep >= 2 ? aluResult : '...'} />
         </div>

         <StepInfo step={microStep} steps={[
           "Operands retrieved from Registers or Immediate field.",
           "Multiplexer B selects between Register B and Constant.",
           "ALU performs operation (ADD, SUB, AND, etc.)."
         ]} />
       </div>
    </div>
  );
};

// --- WRITE BACK DETAIL VIEW ---
export const WriteBackDetailView: React.FC<DetailViewProps> = ({ state, onBack, microStep }) => {
  const { controlSignals, aluResult, dataMemory, registers } = state;
  const memVal = dataMemory[aluResult] || 0;
  const writeVal = controlSignals.MD ? memVal : aluResult;
  
  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-lg overflow-hidden border border-slate-900 flex flex-col">
       <Header title="Write Back Stage: Result Storage" subtitle="Updating Registers or Memory" onBack={onBack} />
       <div className="relative flex-1 p-8">
         <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Step 0: Inputs to Mux D */}
            <Wire id="alu-in" d="M 100 200 L 300 200" isActive={microStep >= 0} label="ALU Result" value={aluResult} />
            <Wire id="mem-in" d="M 100 350 L 300 350" isActive={microStep >= 0} label="Mem Data" value={memVal} />
            
            {/* Step 1: Mux D Select */}
            <Wire id="mux-d-out" d="M 360 275 L 550 275" isActive={microStep >= 1} label="Write Data" value={writeVal} />

            {/* Step 2: Write */}
            <Wire id="reg-write" d="M 680 275 L 750 275" isActive={microStep >= 2 && controlSignals.RW} color="#10b981" />
         </svg>

         <div className="absolute top-[180px] left-[50px] space-y-24">
             <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs text-slate-400 w-24 text-center">ALU Output</div>
             <div className="bg-slate-900 border border-slate-700 p-2 rounded text-xs text-slate-400 w-24 text-center">Data Memory Output</div>
         </div>

         <div className="absolute top-[230px] left-[300px]">
             <CpuComponent title="MUX D" isActive={microStep >= 1} className="w-16 h-24" value={controlSignals.MD ? '1' : '0'} />
         </div>

         <div className="absolute top-[210px] left-[550px]">
             <CpuComponent title="Registers" isActive={microStep >= 2 && controlSignals.RW} className="w-32 h-32" icon={<Save size={24}/>} details={<span>Writing {writeVal}</span>} />
         </div>

         <StepInfo step={microStep} steps={[
           "Data arrives at Write-Back Multiplexer (MUX D).",
           "MUX D selects between ALU Result and Memory Data.",
           controlSignals.RW ? `Value ${writeVal} written to Destination Register.` : "No Register Write for this instruction."
         ]} />
       </div>
    </div>
  );
};


// --- SHARED COMPONENTS ---

const Header: React.FC<{title: string, subtitle: string, onBack: () => void}> = ({ title, subtitle, onBack }) => (
  <div className="bg-slate-900 p-4 flex items-center gap-4 border-b border-slate-800 z-10">
    <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-amber-400" title="Step Out">
      <ArrowLeft size={20} />
    </button>
    <div>
       <h2 className="text-lg font-bold text-white">{title}</h2>
       <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
  </div>
);

const StepInfo: React.FC<{step: number, steps: string[]}> = ({ step, steps }) => (
   <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-amber-500/30 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300">
      <div className="flex items-center gap-3">
         <div className="flex gap-1">
            {steps.map((_, i) => (
               <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-amber-500' : i < step ? 'bg-amber-500/40' : 'bg-slate-700'}`} />
            ))}
         </div>
         <span className="text-sm font-medium text-amber-100">{steps[Math.min(step, steps.length-1)]}</span>
      </div>
   </div>
);
