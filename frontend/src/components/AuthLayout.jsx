import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const POINTS = [
  { title: "Always-on checks", desc: "Uptime and response time, tracked for every site you add." },
  { title: "Email alerts", desc: "Hear about a failing site from us, not from your users." },
  { title: "Clear history", desc: "Charts and a check log for each monitor." },
];

// Split-screen shell shared by Login and Signup: brand panel on the left, form on the right.
const AuthLayout = ({ title, subtitle, children, footer }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/30 grid lg:grid-cols-2">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        .HeadingFont { font-family: 'Space Grotesk', sans-serif; }
        .BodyFont { font-family: 'Inter', sans-serif; }
        .auth-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 70% at 30% 30%, #000 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(ellipse 80% 70% at 30% 30%, #000 30%, transparent 80%);
        }
        .text-gradient {
          background: linear-gradient(100deg, #fbbf24 0%, #f59e0b 40%, #fb923c 100%);
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
        }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 40px #14141c inset; -webkit-text-fill-color: #fff; }
        a:focus-visible, button:focus-visible { outline: 2px solid #f59e0b; outline-offset: 3px; border-radius: 8px; }
      `}</style>

      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16 border-r border-white/5 bg-[#0c0c12]">
        <div className="absolute inset-0 auth-grid pointer-events-none" />
        <div className="absolute -top-32 -left-24 w-[480px] h-[480px] rounded-full bg-amber-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[360px] h-[360px] rounded-full bg-orange-600/10 blur-[120px] pointer-events-none" />

        <button onClick={() => navigate("/")} className="relative flex items-center gap-2 w-fit">
          <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none">
            <path d="M12 4.5l-7.5 15h15L12 4.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xl font-bold tracking-tight HeadingFont">Watchtower</span>
        </button>

        <div className="relative max-w-lg">
          <h2 className="text-4xl xl:text-5xl font-bold HeadingFont leading-[1.1] tracking-tight mb-10">
            Know when your site goes down <span className="text-gradient">before your users do.</span>
          </h2>
          <ul className="space-y-6">
            {POINTS.map((p, i) => (
              <motion.li
                key={p.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.12 }}
                className="flex gap-4"
              >
                <span className="mt-1 w-6 h-6 shrink-0 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="font-semibold HeadingFont">{p.title}</p>
                  <p className="text-sm text-gray-400 BodyFont">{p.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-gray-600 BodyFont">© {new Date().getFullYear()} Watchtower</p>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center px-4 sm:px-8 py-12">
        <div className="lg:hidden absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-500/15 blur-[100px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-md"
        >
          <button onClick={() => navigate("/")} className="lg:hidden flex items-center gap-2 mb-8">
            <svg className="w-7 h-7 text-amber-500" viewBox="0 0 24 24" fill="none">
              <path d="M12 4.5l-7.5 15h15L12 4.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <span className="text-lg font-bold HeadingFont">Watchtower</span>
          </button>

          <h1 className="text-3xl sm:text-4xl font-bold HeadingFont tracking-tight mb-2">{title}</h1>
          <p className="text-gray-400 BodyFont mb-8">{subtitle}</p>

          {children}

          <p className="mt-8 text-center text-sm text-gray-500 BodyFont">{footer}</p>
        </motion.div>
      </main>
    </div>
  );
};

export const AuthLink = ({ to, children }) => (
  <Link to={to} className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
    {children}
  </Link>
);

export const PasswordToggle = ({ shown, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={shown ? "Hide password" : "Show password"}
    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-amber-500 transition-colors"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {shown ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </>
      )}
    </svg>
  </button>
);

export const Spinner = () => (
  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
);

export default AuthLayout;
