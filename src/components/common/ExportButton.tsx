import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExportButtonProps {
  onExport: (format: 'pdf' | 'excel') => void;
  label?: string;
  disabled?: boolean;
}

export function ExportButton({ onExport, label = "Export Report", disabled = false }: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: 'pdf' | 'excel') => {
    onExport(format);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <Button 
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download className="w-4 h-4 mr-2" />
        {label}
        <ChevronDown className="w-4 h-4 ml-2" />
      </Button>
      {showMenu && !disabled && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700 text-white text-sm transition-colors rounded-t-lg"
            >
              <FileText className="w-4 h-4 text-red-400" />
              <span>Export as PDF</span>
            </button>
            <div className="border-t border-gray-700" />
            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-700 text-white text-sm transition-colors rounded-b-lg"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-400" />
              <span>Export as Excel</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
