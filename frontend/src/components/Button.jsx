const baseClasses = "inline-flex items-center justify-center font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";
const sizeClasses = "px-6 py-3 text-sm";
const roundedClasses = "rounded-[20px]";

const variants = {
  primary: "bg-[#22C55E] text-white hover:bg-[#1DAA51] focus:ring-[#22C55E]/40 shadow-sm",
  outline: "border border-[#22C55E] text-[#16A34A] hover:bg-[#22C55E]/10 focus:ring-[#22C55E]/30",
};

const Button = ({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) => {
  return (
    <button
      type={type}
      className={`${baseClasses} ${sizeClasses} ${roundedClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
