import React from "react";

interface LogoProps {
  className?: string;
  iconSize?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  iconSize = 20,
}) => {
  return (
    <div className={`flex items-center gap-2 select-none group ${className}`}>
      {/* Minimalist Monochrome Pulse-Cross */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-white transition-opacity duration-200 group-hover:opacity-75 shrink-0"
      >
        <path
          d="M12 3v5m0 8v5M3 12h5l1.5-3.5 2 7 2-5 1.5 1.5H21"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default Logo;
