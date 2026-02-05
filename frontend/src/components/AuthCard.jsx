const AuthCard = ({ title, subtitle, children, footer }) => {
  return (
    <div className="bg-white/95 backdrop-blur rounded-[20px] shadow-xl border border-emerald-100 p-8 w-full max-w-md">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-2">{subtitle}</p>}
      </div>
      {children}
      {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
    </div>
  );
};

export default AuthCard;
