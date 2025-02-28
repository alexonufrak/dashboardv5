import * as React from "react"

const Button = React.forwardRef(({ className, variant = "default", size = "md", asChild = false, children, ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none";
  
  // Variant classes
  const variantClasses = {
    default: "bg-primary text-white hover:bg-blue-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    outline: "border border-gray-300 bg-white hover:bg-gray-100",
    secondary: "bg-secondary text-white hover:bg-gray-600",
    ghost: "bg-transparent hover:bg-gray-100",
    link: "text-primary hover:underline bg-transparent"
  };
  
  // Size classes
  const sizeClasses = {
    sm: "text-sm px-2 py-1",
    md: "px-3 py-2",
    lg: "text-lg px-4 py-2",
    icon: "w-10 h-10"
  };
  
  const allClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`;
  
  return React.createElement(
    "button",
    {
      className: allClasses,
      ref,
      ...props
    },
    children
  );
});

Button.displayName = "Button";

export { Button };