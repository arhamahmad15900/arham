import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  imgClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  textPosition?: 'right' | 'bottom';
  subtitle?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  imgClassName = '',
  size = 'md',
  showText = false,
  textPosition = 'right',
  subtitle = 'Computer Based Test (CBT) Examination Portal',
  titleClassName = '',
  subtitleClassName = '',
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  // Responsive dimensions designed for 1:1 crisp display across all viewports (320px to 1920px)
  const sizeClasses = {
    xs: 'w-7 h-7 sm:w-8 sm:h-8',
    sm: 'w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10',
    md: 'w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-13 lg:h-13',
    lg: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
    xl: 'w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex ${
        textPosition === 'right' ? 'items-center space-x-2.5 sm:space-x-3.5' : 'flex-col items-center space-y-2'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`relative shrink-0 flex items-center justify-center bg-white rounded-lg p-0.5 ${
          sizeClasses[size] || sizeClasses.md
        }`}
      >
        {!imageError ? (
          <img
            src="/logo.png"
            alt="Access Computer Education Center logo"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className={`w-full h-full object-contain select-none transition-transform duration-150 ${imgClassName}`}
            style={{ imageRendering: '-webkit-optimize-contrast' }}
          />
        ) : (
          <div className="w-full h-full rounded bg-[#02529c] text-white font-black flex items-center justify-center text-xs sm:text-sm shadow-xs">
            ACE
          </div>
        )}
      </div>

      {showText && (
        <div className={`min-w-0 ${textPosition === 'bottom' ? 'text-center' : 'text-left'}`}>
          <div
            className={`font-extrabold text-gray-900 tracking-tight leading-tight ${
              titleClassName || 'text-xs sm:text-sm md:text-base'
            }`}
          >
            Access Computer Education Center
          </div>
          {subtitle && (
            <div
              className={`text-[10px] sm:text-xs text-blue-900/80 font-medium leading-tight mt-0.5 ${subtitleClassName}`}
            >
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
