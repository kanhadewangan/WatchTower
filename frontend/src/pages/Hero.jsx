import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const Logo = ({ className = "w-8 h-8" }) => (
  <svg className={`${className} text-amber-500`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4.5l-7.5 15h15L12 4.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Nav = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <Logo />
          <span className="text-xl font-bold tracking-tight HeadingFont">Watchtower</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400 BodyFont">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors HeadingFont"
          >
            Sign in
          </button>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(245, 158, 11, 0.45)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/signup")}
            className="px-5 py-2 text-sm font-bold bg-amber-500 text-black rounded-xl HeadingFont"
          >
            Start Watching
          </motion.button>
        </div>

        <button
          className="md:hidden p-2 text-amber-500"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      <motion.div style={{ scaleX: progress }} className="absolute bottom-0 inset-x-0 h-px origin-left bg-gradient-to-r from-amber-500 to-orange-500" />

      {menuOpen && (
        <div className="md:hidden mx-4 mb-4 p-2 bg-[#111118]/95 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-col">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="px-4 py-3 text-sm text-gray-200 hover:text-amber-500 transition-colors">
              {l.label}
            </a>
          ))}
          <button onClick={() => navigate("/login")} className="px-4 py-3 text-left text-sm text-gray-200 hover:text-amber-500 transition-colors">
            Sign in
          </button>
          <button onClick={() => navigate("/signup")} className="m-2 px-5 py-3 text-sm font-bold bg-amber-500 text-black rounded-xl HeadingFont">
            Start Watching
          </button>
        </div>
      )}
    </motion.nav>
  );
};

// Card with a soft spotlight that follows the cursor.
const SpotlightCard = ({ children, className = "", ...rest }) => {
  const ref = useRef(null);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - r.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <motion.div ref={ref} onMouseMove={onMove} className={`spotlight ${className}`} {...rest}>
      {children}
    </motion.div>
  );
};

const FAQS = [
  { q: "What do I need to get started?", a: "Just an account and the URL of the site you want to watch. There's nothing to install." },
  { q: "How will I know when my site is down?", a: "Watchtower sends you an email alert as soon as a check fails." },
  { q: "Can I watch more than one site?", a: "Yes. Add as many sites as you like and each one gets its own monitor page." },
  { q: "Where can I see the history?", a: "Every monitor has its own page with response-time charts and a log of recent checks." },
];

const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 py-5 text-left">
        <span className="font-semibold HeadingFont text-lg">{q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} className="text-amber-500 text-2xl leading-none shrink-0">+</motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-gray-400 BodyFont leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Illustrative sample data for the product mockup (not real measurements).
const SAMPLE_LATENCY = [38, 42, 40, 36, 44, 41, 39, 47, 43, 40, 38, 45, 52, 61, 49, 42, 40, 37, 41, 44, 39, 38, 43, 41];

const ProductPreview = () => {
  const w = 600;
  const h = 160;
  const max = 70;
  const pts = SAMPLE_LATENCY.map((v, i) => [(i / (SAMPLE_LATENCY.length - 1)) * w, h - (v / max) * h]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d14] shadow-[0_30px_120px_rgba(245,158,11,0.12)] overflow-hidden">
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/5 bg-white/[0.03]">
        <span className="w-3 h-3 rounded-full bg-red-500/60" />
        <span className="w-3 h-3 rounded-full bg-amber-500/60" />
        <span className="w-3 h-3 rounded-full bg-green-500/60" />
        <span className="ml-4 text-[11px] text-gray-500 font-mono truncate">watchtower / monitor / example.com</span>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-600 BodyFont hidden sm:block">Sample view</span>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { k: "Status", v: "Up", c: "text-green-400" },
            { k: "Uptime", v: "—", c: "text-white" },
            { k: "Response", v: "— ms", c: "text-white" },
            { k: "Last check", v: "just now", c: "text-white" },
          ].map((s) => (
            <div key={s.k} className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 BodyFont">{s.k}</div>
              <div className={`mt-2 text-lg sm:text-xl font-bold HeadingFont ${s.c}`}>{s.v}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-gray-500 mb-3 BodyFont">
            <span>Response time</span>
            <span>Last 24 checks</span>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32 sm:h-40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill="url(#lat)" />
            <motion.path
              d={line}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut", delay: 0.6 }}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="flex gap-[3px]">
          {Array.from({ length: 48 }).map((_, i) => (
            <span key={i} className={`flex-1 h-6 rounded-sm ${i === 31 ? "bg-red-500/70" : "bg-green-500/50"}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

const Icon = ({ d }) => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
  </svg>
);

const FEATURES = [
  {
    title: "Real-time monitoring",
    desc: "Continuous uptime and response-time checks on every endpoint you add.",
    icon: "M3 12h4l3-8 4 16 3-8h4",
    span: "md:col-span-2",
  },
  {
    title: "Instant email alerts",
    desc: "Get notified the moment a site goes down.",
    icon: "M3 8l9 6 9-6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z",
    span: "",
  },
  {
    title: "Detailed charts & logs",
    desc: "Drill into any monitor to see latency trends and every check that ran.",
    icon: "M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z",
    span: "",
  },
  {
    title: "Add a site in seconds",
    desc: "Paste a URL, name it, and Watchtower starts watching. No agents, no config files.",
    icon: "M12 4v16m8-8H4",
    span: "md:col-span-2",
  },
];

const STEPS = [
  { n: "01", title: "Add your site", desc: "Give your website a name and a URL." },
  { n: "02", title: "We keep watching", desc: "Checks run continuously and results are stored for you." },
  { n: "03", title: "Get alerted", desc: "If something breaks, you hear about it by email first." },
];

const FREE_FEATURES = [
  "Uptime and response-time checks",
  "Email alerts when a site goes down",
  "Charts and a log for every monitor",
  "Add your sites in seconds",
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: "easeOut" },
};

const Hero = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const glowY = useTransform(scrollY, [0, 600], [0, 120]);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/30 overflow-x-hidden relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        html { scroll-behavior: smooth; }
        a:focus-visible, button:focus-visible { outline: 2px solid #f59e0b; outline-offset: 3px; border-radius: 8px; }
        .HeadingFont { font-family: 'Space Grotesk', sans-serif; }
        .BodyFont { font-family: 'Inter', sans-serif; }
        .grid-fade {
          background-image:
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, #000 30%, transparent 75%);
        }
        .text-gradient {
          background: linear-gradient(100deg, #fbbf24 0%, #f59e0b 40%, #fb923c 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .spotlight { position: relative; }
        .spotlight::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
          background: radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(245,158,11,0.14), transparent 60%);
          opacity: 0; transition: opacity .3s;
        }
        .spotlight:hover::before { opacity: 1; }
        .noise {
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.5'/></svg>");
          mix-blend-mode: overlay;
        }
        .shimmer { position: relative; overflow: hidden; }
        .shimmer::after {
          content: ""; position: absolute; inset: 0; transform: translateX(-100%);
          background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%);
          animation: shimmer 3.5s ease-in-out infinite;
        }
        @keyframes shimmer { 60%, 100% { transform: translateX(100%); } }
        @keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .floaty { animation: floaty 6s ease-in-out infinite; }
        @keyframes aurora {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -30px) scale(1.15); }
        }
        .aurora { animation: aurora 12s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .aurora, .shimmer::after, .floaty { animation: none; } html { scroll-behavior: auto; } }
      `}</style>

      <div className="noise fixed inset-0 opacity-[0.035] pointer-events-none z-0" />

      <Nav />

      {/* Hero */}
      <section className="relative pt-36 sm:pt-44 pb-16 px-4 sm:px-8">
        <div className="absolute inset-x-0 top-0 h-[700px] grid-fade pointer-events-none" />
        <motion.div style={{ y: glowY }} className="absolute inset-x-0 top-0 h-[600px] pointer-events-none overflow-hidden">
          <div className="aurora absolute -top-40 left-1/2 -translate-x-[80%] w-[520px] h-[520px] rounded-full bg-amber-500/20 blur-[120px]" />
          <div className="aurora absolute -top-24 left-1/2 -translate-x-[10%] w-[420px] h-[420px] rounded-full bg-orange-600/15 blur-[120px]" style={{ animationDelay: "-6s" }} />
        </motion.div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-xs text-gray-300 BodyFont">Website uptime monitoring, made simple</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-bold HeadingFont leading-[1.05] tracking-tight mb-6"
          >
            Know when your site
            <br />
            goes down <span className="text-gradient">before your users do.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="text-base sm:text-lg md:text-xl text-gray-400 BodyFont max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Watchtower tracks uptime and response times around the clock and emails you the moment something breaks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(245, 158, 11, 0.5)" }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate("/signup")}
              className="shimmer w-full sm:w-auto px-8 py-4 bg-amber-500 text-black font-bold rounded-xl HeadingFont"
            >
              Start Watching — it's free
            </motion.button>
            <motion.a
              href="#how"
              whileHover={{ scale: 1.04, backgroundColor: "rgba(255,255,255,0.06)" }}
              whileTap={{ scale: 0.96 }}
              className="w-full sm:w-auto px-8 py-4 border border-white/15 text-white font-bold rounded-xl HeadingFont text-center"
            >
              How it works
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
          className="max-w-5xl mx-auto mt-16 sm:mt-24 relative z-10"
        >
          <div className="absolute -inset-x-10 -bottom-10 h-40 bg-amber-500/15 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative">
            <ProductPreview />
            <div className="floaty hidden md:flex absolute -right-6 -bottom-8 items-start gap-3 w-72 p-4 rounded-2xl bg-[#14141c]/95 backdrop-blur-xl border border-white/10 shadow-2xl text-left">
              <div className="w-9 h-9 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold HeadingFont">example.com is down</p>
                <p className="text-xs text-gray-500 BodyFont mt-0.5">Email alert sent · sample</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-500 mb-3 HeadingFont font-bold">Features</p>
            <h2 className="text-3xl md:text-5xl font-bold HeadingFont tracking-tight">Everything you need to stay up.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {FEATURES.map((f, i) => (
              <SpotlightCard
                key={f.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                whileHover={{ y: -6 }}
                className={`group relative p-7 rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 hover:border-amber-500/40 transition-colors overflow-hidden ${f.span}`}
              >
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-12 h-12 mb-6 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                  <Icon d={f.icon} />
                </div>
                <h3 className="relative text-xl font-bold HeadingFont mb-2">{f.title}</h3>
                <p className="relative text-gray-400 BodyFont leading-relaxed">{f.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-500 mb-3 HeadingFont font-bold">How it works</p>
            <h2 className="text-3xl md:text-5xl font-bold HeadingFont tracking-tight">Up and running in a minute.</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-8 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.12 }}
                className="relative text-center px-4"
              >
                <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-[#111118] border border-amber-500/30 flex items-center justify-center text-amber-500 text-lg font-bold HeadingFont shadow-[0_0_30px_rgba(245,158,11,0.15)]">
                  {s.n}
                </div>
                <h3 className="text-xl font-bold HeadingFont mb-2">{s.title}</h3>
                <p className="text-gray-400 BodyFont">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-500 mb-3 HeadingFont font-bold">Pricing</p>
            <h2 className="text-3xl md:text-5xl font-bold HeadingFont tracking-tight mb-3">Free while we're in beta.</h2>
            <p className="text-gray-400 BodyFont">No credit card required. Paid plans may come later — we'll tell you first.</p>
          </motion.div>

          <motion.div
            {...fadeUp}
            className="relative max-w-md mx-auto p-8 rounded-3xl flex flex-col bg-gradient-to-b from-amber-500/10 to-[#111118] border border-amber-500/60 shadow-[0_0_60px_rgba(245,158,11,0.12)]"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full">
              Beta
            </div>
            <h3 className="text-lg font-bold HeadingFont mb-2 text-amber-500">Watchtower</h3>
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-5xl font-bold HeadingFont">Free</span>
              <span className="text-gray-500 text-sm">during beta</span>
            </div>
            <ul className="space-y-3 mb-10 flex-1">
              {FREE_FEATURES.map((li) => (
                <li key={li} className="flex items-center gap-3 text-sm text-gray-300 BodyFont">
                  <svg className="w-4 h-4 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  {li}
                </li>
              ))}
            </ul>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(245, 158, 11, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/signup")}
              className="w-full py-4 rounded-xl font-bold HeadingFont bg-amber-500 text-black"
            >
              Start Watching
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-4 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-amber-500 mb-3 HeadingFont font-bold">FAQ</p>
            <h2 className="text-3xl md:text-5xl font-bold HeadingFont tracking-tight">Questions, answered.</h2>
          </motion.div>
          <motion.div {...fadeUp} className="border-t border-white/10">
            {FAQS.map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-8">
        <motion.div
          {...fadeUp}
          className="max-w-5xl mx-auto relative overflow-hidden text-center rounded-[2rem] border border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-[#111118] to-[#0a0a0f] px-6 py-16 sm:py-20"
        >
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/20 blur-[100px] rounded-full pointer-events-none" />
          <h2 className="relative text-3xl md:text-5xl font-bold HeadingFont tracking-tight mb-4">Stop finding out from your users.</h2>
          <p className="relative text-gray-400 BodyFont mb-8 max-w-xl mx-auto">Add your first site in under a minute.</p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(245, 158, 11, 0.5)" }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate("/signup")}
            className="relative px-8 py-4 bg-amber-500 text-black font-bold rounded-xl HeadingFont"
          >
            Start Watching
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="text-lg font-bold tracking-tight HeadingFont">Watchtower</span>
            <span className="ml-3 text-gray-500 text-sm BodyFont hidden sm:block">Watching so you don't have to.</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400 BodyFont">
            <Link to="/security" className="hover:text-amber-500 transition-colors">Security</Link>
            <Link to="/terms" className="hover:text-amber-500 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-amber-500 transition-colors">Privacy</Link>
          </div>
        </div>
        <p className="max-w-6xl mx-auto mt-8 text-gray-600 text-[10px] uppercase tracking-[0.2em] BodyFont text-center sm:text-left">
          © {new Date().getFullYear()} Watchtower. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default Hero;
