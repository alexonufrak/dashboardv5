import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Logo component that can display different variations of the xFoundry logo
 * 
 * @param {Object} props
 * @param {string} props.variant - "horizontal" or "square"
 * @param {string} props.color - "eden" or "white"
 * @param {number} props.height - Height in pixels
 * @param {boolean} props.clickable - Whether the logo links to the homepage
 * @returns {JSX.Element} Logo component
 */
const Logo = ({ 
  variant = "horizontal", 
  color = "auto", // 'auto' will choose based on theme, or can specify 'eden' or 'white'
  height = 40, 
  clickable = true,
  className = "",
}) => {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Determine the current effective theme - only after mounting to avoid hydration errors
  const currentTheme = mounted ? (theme === 'system' ? systemTheme : theme) : 'light';
  
  // Effect for ensuring we only use client-side theme after hydration
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // If color is 'auto', determine based on theme
  const effectiveColor = color === 'auto' 
    ? (currentTheme === 'dark' ? 'white' : 'eden')
    : color;
  
  // Calculate width based on height and aspect ratio
  const getWidth = () => {
    // Horizontal logo has approximately 4:1 ratio, square logo is 1:1
    return variant === "horizontal" ? height * 4 : height;
  };

  // Instead of using <object> which can't be styled properly, use an <img> with CSS filter
  const renderLogo = () => {
    // Always use the blue version and apply CSS filter for white mode
    const logoSrc = variant === "horizontal"
      ? "/logos/xFoundry Blue 900 (1).svg"
      : "/logos/X Icon Blue.svg";
    
    // Use CSS filters to make the blue logo white in dark mode
    const isWhite = effectiveColor === "white";
    
    return (
      <div className={`relative ${className}`} style={{ 
        height: `${height}px`, 
        width: `${getWidth()}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <img
          src={logoSrc}
          alt="xFoundry Logo"
          className={`w-full h-full`}
          style={{
            filter: isWhite ? "brightness(0) invert(1)" : "none",
            transition: "filter 0.3s ease"
          }}
        />
      </div>
    );
  };

  if (!mounted) {
    // Return a placeholder with the same dimensions during SSR/before hydration
    return (
      <div className={`${className} opacity-0`} style={{ 
        height: `${height}px`, 
        width: `${getWidth()}px` 
      }} />
    );
  }

  return clickable ? (
    <Link href="/" className="inline-block">
      {renderLogo()}
    </Link>
  ) : (
    renderLogo()
  );
};

export default Logo;