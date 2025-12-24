import React from 'react';
import { Instruction, ControlSignals } from '../../types';
import { Wire } from '../Wire';
import { ArrowLeft } from 'lucide-react';

interface ControlLogicViewProps {
  instruction: Instruction;
  controlSignals: ControlSignals;
  onBack: () => void;
  microStep?: number; // Optional to keep backward compat if needed, but we use it now
}

export const ControlLogicView: React.FC<ControlLogicViewProps> = ({ instruction, controlSignals, onBack, microStep = 3 }) => {
  const binary = instruction.binary;
  const bit15 = binary[0];
  const bit14 = binary[1];
  const bit13 = binary[2];
  const bit9 = binary[6];

  // Microsteps:
  // 0: Inputs
  // 1: Inverters (NOT)
  // 2: AND Gates
  // 3: Outputs

  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-lg overflow-hidden border border-slate-900 flex flex-col">
      
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center gap-4 border-b border-slate-800 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-amber-400" title="Step Out">
          <ArrowLeft size={20} />
        </button>
        <div>
           <h2 className="text-lg font-bold text-white">Decode Stage: Control Logic</h2>
           <p className="text-xs text-slate-500">Page 35: Internal Gate Array Visualization</p>
        </div>
        <div className="ml-auto font-mono text-sm bg-black px-3 py-1 rounded border border-slate-700 text-cyan-400">
           OPCODE: <span className="text-white">{binary.substring(0, 7)}</span>
        </div>
      </div>

      <div className="relative flex-1 p-8">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          
          {/* Input Bus Lines */}
          <Wire id="bit15" d="M 100 50 L 100 450" isActive={microStep >= 0 && bit15 === '1'} label="Bit 15" color="#ef4444" />
          <Wire id="bit14" d="M 150 50 L 150 450" isActive={microStep >= 0 && bit14 === '1'} label="Bit 14" color="#ef4444" />
          <Wire id="bit13" d="M 200 50 L 200 450" isActive={microStep >= 0 && bit13 === '1'} label="Bit 13" color="#ef4444" />
          <Wire id="bit9"  d="M 250 50 L 250 450" isActive={microStep >= 0 && bit9 === '1'} label="Bit 9" color="#ef4444" />

          {/* Logic Connections */}
          
          {/* MB = Bit 15 */}
          <Wire id="wire-mb" d="M 100 100 L 500 100" isActive={microStep >= 3 && bit15 === '1'} label="MB Signal" />
          
          {/* RW Logic */}
          <Wire id="wire-rw-in" d="M 150 150 L 300 150" isActive={microStep >= 0 && bit14 === '1'} />
          <Wire id="wire-rw-out" d="M 340 150 L 500 150" isActive={microStep >= 1 && bit14 === '0'} label="RW Signal" />

          {/* MW Logic */}
          <Wire id="wire-mw-14" d="M 150 220 L 360 220" isActive={microStep >= 0 && bit14 === '1'} />
          <Wire id="wire-mw-15" d="M 100 240 L 300 240" isActive={microStep >= 0 && bit15 === '1'} />
          <Wire id="wire-mw-15-not" d="M 340 240 L 360 240" isActive={microStep >= 1 && bit15 === '0'} />
          <Wire id="wire-mw-out" d="M 400 230 L 500 230" isActive={microStep >= 2 && controlSignals.MW} label="MW Signal" />

          {/* PL Logic */}
          <Wire id="wire-pl-15" d="M 100 300 L 360 300" isActive={microStep >= 0 && bit15 === '1'} />
          <Wire id="wire-pl-14" d="M 150 320 L 360 320" isActive={microStep >= 0 && bit14 === '1'} />
          <Wire id="wire-pl-out" d="M 400 310 L 500 310" isActive={microStep >= 2 && controlSignals.PL} label="PL Signal" />
          
        </svg>

        {/* --- Logic Gates --- */}
        <Gate type="NOT" x={300} y={135} active={microStep >= 1} />
        <Gate type="NOT" x={300} y={225} active={microStep >= 1} />
        <Gate type="AND" x={360} y={210} active={microStep >= 2} />
        <Gate type="AND" x={360} y={290} active={microStep >= 2} />

        {/* Labels */}
        <div className={`absolute right-[50px] top-[90px] font-bold transition-colors ${microStep >= 3 && controlSignals.MB ? 'text-amber-400' : 'text-slate-600'}`}>MB</div>
        <div className={`absolute right-[50px] top-[140px] font-bold transition-colors ${microStep >= 3 && controlSignals.RW ? 'text-amber-400' : 'text-slate-600'}`}>RW</div>
        <div className={`absolute right-[50px] top-[220px] font-bold transition-colors ${microStep >= 3 && controlSignals.MW ? 'text-amber-400' : 'text-slate-600'}`}>MW</div>
        <div className={`absolute right-[50px] top-[300px] font-bold transition-colors ${microStep >= 3 && controlSignals.PL ? 'text-amber-400' : 'text-slate-600'}`}>PL</div>

         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-amber-500/30 px-6 py-3 rounded-full shadow-2xl backdrop-blur-md">
            <span className="text-sm font-medium text-amber-100">
               {microStep === 0 && "OpCode Bits enter the Decoder."}
               {microStep === 1 && "Signals pass through Inverters (NOT gates)."}
               {microStep === 2 && "AND Gates combine signals."}
               {microStep >= 3 && "Control Word generated."}
            </span>
         </div>
      </div>
    </div>
  );
};

const Gate: React.FC<{type: string, x: number, y: number, active: boolean}> = ({ type, x, y, active }) => (
  <div 
    className={`absolute w-10 h-${type === 'AND' ? '10' : '8'} border rounded-tr-full rounded-br-full flex items-center justify-center text-[10px] z-10 transition-all duration-300
    ${active ? 'bg-amber-900/50 border-amber-500 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-800 border-slate-600 text-slate-500'}
    `}
    style={{ left: x, top: y }}
  >
    {type}
    {type === 'NOT' && <div className={`absolute -right-1 w-2 h-2 rounded-full border ${active ? 'bg-amber-500 border-amber-800' : 'bg-slate-600 border-slate-900'}`}></div>}
  </div>
);
