import React from 'react';
import { CpuState, CpuStage } from '../../types';
import { ArrowLeft, Save, Binary, Hash } from 'lucide-react';

interface RegisterFileViewProps {
  state: CpuState;
  onBack: () => void;
}

export const RegisterFileView: React.FC<RegisterFileViewProps> = ({ state, onBack }) => {
  const { registers, currentStage, instructionMemory, currentInstructionIndex, controlSignals } = state;
  const currentInstr = instructionMemory[currentInstructionIndex];
  
  // Identify active registers based on stage
  const src1 = currentInstr?.src1;
  const src2 = currentInstr?.src2;
  const dest = currentInstr?.dest;

  // Determine Register Status
  const getRegStatus = (index: number) => {
    // Write Logic: Only in WRITE_BACK stage if RW signal is active
    if (currentStage === CpuStage.WRITE_BACK && controlSignals.RW && dest === index) {
      return 'write';
    }
    // Read Logic: In EXECUTE or DECODE (operand fetch)
    // Note: src2 is only read if we are NOT using Immediate (MB=0) for the second operand, 
    // OR if it's a STORE instruction (where src2 is the data to store).
    // For simplicity, we highlight if it's a valid src register index for the instruction type.
    if ((currentStage === CpuStage.DECODE || currentStage === CpuStage.EXECUTE)) {
      if (src1 === index) return 'read';
      if (src2 === index && !controlSignals.MB) return 'read'; 
    }
    return 'idle';
  };

  const toHex = (num: number) => '0x' + (num >>> 0).toString(16).toUpperCase().padStart(4, '0');
  const toBin = (num: number) => (num >>> 0).toString(2).padStart(16, '0').match(/.{1,4}/g)?.join(' ') || '';

  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-lg overflow-hidden border border-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center gap-4 border-b border-slate-800 z-10 shadow-md">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-amber-400" title="Step Out">
          <ArrowLeft size={20} />
        </button>
        <div>
           <h2 className="text-lg font-bold text-white flex items-center gap-2">
             <Save size={18} className="text-cyan-400"/> Register File
           </h2>
           <p className="text-xs text-slate-500">8 x General Purpose Registers (16-bit)</p>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 p-6 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full content-start">
          {registers.map((val, index) => {
            const status = getRegStatus(index);
            const isWrite = status === 'write';
            const isRead = status === 'read';
            
            let borderColor = 'border-slate-800';
            let bgColor = 'bg-slate-900/50';
            let glow = '';

            if (isWrite) {
              borderColor = 'border-amber-500';
              bgColor = 'bg-amber-950/30';
              glow = 'shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-105';
            } else if (isRead) {
              borderColor = 'border-cyan-500';
              bgColor = 'bg-cyan-950/30';
              glow = 'shadow-[0_0_15px_rgba(6,182,212,0.2)]';
            }

            return (
              <div 
                key={index}
                className={`relative p-4 rounded-xl border ${borderColor} ${bgColor} ${glow} transition-all duration-300 flex flex-col gap-2 group hover:border-slate-600`}
              >
                {/* Register Label */}
                <div className="flex justify-between items-center mb-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    R{index}
                  </div>
                  {isWrite && <span className="text-[10px] font-bold text-amber-500 animate-pulse">WRITING</span>}
                  {isRead && <span className="text-[10px] font-bold text-cyan-400">READING</span>}
                </div>

                {/* Main Value */}
                <div className={`text-2xl font-mono font-bold truncate ${isWrite ? 'text-amber-400' : isRead ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {val}
                </div>

                {/* Details */}
                <div className="space-y-1 mt-auto pt-2 border-t border-slate-800/50">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1"><Hash size={10}/> HEX</span>
                    <span className="text-slate-400">{toHex(val)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1"><Binary size={10}/> BIN</span>
                    <span className="text-slate-400 tracking-tighter">{toBin(val)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend / Footer */}
      <div className="bg-slate-950 border-t border-slate-900 p-3 flex gap-6 justify-center text-xs font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></div> Source (Read)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div> Destination (Write)
          </div>
      </div>
    </div>
  );
};