import React from 'react';

interface CodeEditorProps {
  code: string;
  onChange: (val: string) => void;
  highlightLine: number;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, highlightLine }) => {
  const lines = code.split('\n');

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-inner font-mono text-sm">
      <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Assembly Editor</span>
        <div className="flex gap-2">
           <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
           <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
           <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      <div className="flex-1 overflow-auto relative flex">
        {/* Line Numbers */}
        <div className="w-10 py-4 bg-slate-900/50 text-slate-600 text-right pr-3 select-none border-r border-slate-800">
          {lines.map((_, i) => (
            <div key={i} className={`leading-6 ${i === highlightLine ? 'text-amber-400 font-bold' : ''}`}>
              {i}
            </div>
          ))}
        </div>
        
        {/* Text Area Overlay Logic */}
        <div className="flex-1 relative">
           {/* Highlight Bar */}
           {highlightLine !== -1 && (
             <div 
               className="absolute left-0 right-0 h-6 bg-amber-500/10 border-l-2 border-amber-500 pointer-events-none transition-all duration-200"
               style={{ top: `${highlightLine * 1.5 + 1}rem` }} // Approximation for line-height
             ></div>
           )}
           
           <textarea
             className="w-full h-full bg-transparent text-slate-300 p-4 resize-none focus:outline-none leading-6 font-mono z-10 relative"
             value={code}
             onChange={(e) => onChange(e.target.value)}
             spellCheck={false}
             style={{ whiteSpace: 'pre' }}
           />
        </div>
      </div>
    </div>
  );
};
