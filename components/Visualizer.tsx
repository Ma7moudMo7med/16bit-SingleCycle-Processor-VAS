import React from 'react';
import { CpuState, ViewMode, Instruction, OpCode, CpuStage } from '../types';
import { DatapathView } from './views/DatapathView';
import { ControlLogicView } from './views/ControlLogicView';
import { FetchDetailView, ExecuteDetailView, WriteBackDetailView } from './views/DetailedViews';
import { RegisterFileView } from './views/RegisterFileView';

interface VisualizerProps {
  state: CpuState;
  onSetView: (mode: ViewMode) => void;
  onFocusComponent: (component: string) => void;
}

export const Visualizer: React.FC<VisualizerProps> = ({ state, onSetView, onFocusComponent }) => {
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

  const currentInstr = state.instructionMemory[state.currentInstructionIndex] || fallbackInstruction;

  const renderMicroView = () => {
    // If a specific component is focused (via click), show that view
    if (state.focusedComponent === 'REGISTERS') {
      return <RegisterFileView state={state} onBack={() => onSetView(ViewMode.MACRO)} />;
    }

    // Otherwise, default to the stage-based detailed view (Step Into behavior)
    // Note: If focusedComponent is set to a Stage Name (e.g. 'FETCH'), it falls through here effectively 
    // because we map stages to views below.
    const targetStage = state.focusedComponent as CpuStage || state.currentStage;
    
    // We map the requested component/stage to the correct view
    // If the user clicked "PC" or "Instruction Memory" -> Fetch View
    if (state.focusedComponent === 'FETCH' || (!state.focusedComponent && state.currentStage === CpuStage.FETCH)) {
        return <FetchDetailView state={state} onBack={() => onSetView(ViewMode.MACRO)} microStep={state.microStep} />;
    }

    if (state.focusedComponent === 'DECODE' || (!state.focusedComponent && state.currentStage === CpuStage.DECODE)) {
       return <ControlLogicView instruction={currentInstr} controlSignals={state.controlSignals} onBack={() => onSetView(ViewMode.MACRO)} microStep={state.microStep} />;
    }

    if (state.focusedComponent === 'EXECUTE' || (!state.focusedComponent && state.currentStage === CpuStage.EXECUTE)) {
       return <ExecuteDetailView state={state} onBack={() => onSetView(ViewMode.MACRO)} microStep={state.microStep} />;
    }
    
    if (state.focusedComponent === 'WRITE_BACK' || (!state.focusedComponent && state.currentStage === CpuStage.WRITE_BACK)) {
       return <WriteBackDetailView state={state} onBack={() => onSetView(ViewMode.MACRO)} microStep={state.microStep} />;
    }

    // Fallback if something goes wrong
    return <DatapathView state={state} onComponentClick={onFocusComponent} />;
  };

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl transition-all duration-500">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#4b5563 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <div className="p-8 h-full">
        {state.viewMode === ViewMode.MACRO && (
          <DatapathView 
            state={state} 
            onComponentClick={onFocusComponent} 
          />
        )}

        {state.viewMode === ViewMode.MICRO && renderMicroView()}
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-0 w-full h-10 bg-slate-900/80 border-t border-slate-800 flex items-center px-6 justify-between text-xs text-slate-400">
         <div className="flex gap-4">
            {state.viewMode === ViewMode.MACRO && <span>Viewing: Architecture Overview (Level 1)</span>}
            {state.viewMode === ViewMode.MICRO && (
              <span className="text-amber-400">
                Viewing: {state.focusedComponent === 'REGISTERS' ? 'Register File' : `${state.currentStage} Details`} (Level 2)
              </span>
            )}
         </div>
         <div className="uppercase tracking-widest font-bold opacity-50">
           NEXUS ARCHITECTURE v2.0
         </div>
      </div>
    </div>
  );
};