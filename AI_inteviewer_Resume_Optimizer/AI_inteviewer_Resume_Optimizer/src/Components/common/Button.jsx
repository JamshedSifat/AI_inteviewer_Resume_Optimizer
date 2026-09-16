export default function Button({ 
  children, 
  variant = "primary", 
  size = "md", 
  isLoading = false, 
  disabled = false, 
  className = "", 
  ...props 
}) {
  const variantClass = {
    primary: "btn-primary text-white",
    secondary: "btn-secondary",
    outline: "btn-outline btn-primary",
    ghost: "btn-ghost",
    error: "btn-error text-white"
  }[variant] || "btn-primary";

  const sizeClass = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg"
  }[size] || "btn-md";

  return (
    <button 
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="loading loading-spinner loading-xs"></span>}
      {children}
    </button>
  );
}