import Image from 'next/image';
import Link from 'next/link';

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
  color = "eden", 
  height = 40, 
  clickable = true,
  className = "",
}) => {
  const getLogoSrc = () => {
    if (variant === "horizontal") {
      return color === "white"
        ? "/logos/xFoundry Logo.svg"
        : "/logos/xFoundry Blue 900 (1).svg";
    } else {
      return color === "white"
        ? "/logos/X Icon White.svg"
        : "/logos/X Icon Blue.svg";
    }
  };

  // Calculate width based on height and aspect ratio
  const getWidth = () => {
    // Horizontal logo has approximately 4:1 ratio, square logo is 1:1
    return variant === "horizontal" ? height * 4 : height;
  };

  const logoImg = (
    <div className={`relative ${className}`} style={{ height: `${height}px`, width: `${getWidth()}px` }}>
      {/* Use actual SVG logos with object tag for best quality */}
      <object
        data={getLogoSrc()}
        type="image/svg+xml"
        className="w-full h-full"
        aria-label="xFoundry Logo"
      >
        {/* Fallback if SVG doesn't load */}
        <div
          className="w-full h-full bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('/placeholder-logo.svg')`,
            filter: color === "white" ? "brightness(0) invert(1)" : "none"
          }}
        />
      </object>
    </div>
  );

  return clickable ? (
    <Link href="/" className="inline-block">
      {logoImg}
    </Link>
  ) : (
    logoImg
  );
};

export default Logo;