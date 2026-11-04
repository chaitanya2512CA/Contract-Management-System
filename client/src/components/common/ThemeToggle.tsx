import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme mode"
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[#262118] bg-[#121212] text-[#D4AF37] transition hover:bg-[#1A1A1A] hover:border-[#D4AF37] cursor-pointer ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4 text-[#D4AF37]" /> : <Moon className="h-4 w-4 text-[#F5E6C4]" />}
    </button>
  );
};
