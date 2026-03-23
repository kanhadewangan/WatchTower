import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const StatusDot = () => (
  <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
    </span>
    <span className="text-[10px] font-medium uppercase tracking-widest text-amber-500/80 BodyFont">
      All Systems Operational
    </span>
  </div>
);

const Nav = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5"
    >
      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <svg className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4.5l-7.5 15h15L12 4.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xl font-bold tracking-tight text-white HeadingFont">Watchtower</span>
        </div>
        <StatusDot />
      </div>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-gray-400 BodyFont">
        <a href="/dashboard" className="hover:text-amber-500 transition-colors">Dashboard</a>
        <a href="#features" className="hover:text-amber-500 transition-colors">Features</a>
        <a href="#pricing" className="hover:text-amber-500 transition-colors">Pricing</a>
        <a href="#docs" className="hover:text-amber-500 transition-colors">Docs</a>
      </div>

      {/* Hamburger Icon */}
      <button
        className="md:hidden flex flex-col justify-center items-center ml-4"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span className="block w-6 h-0.5 bg-amber-500 mb-1"></span>
        <span className="block w-6 h-0.5 bg-amber-500 mb-1"></span>
        <span className="block w-6 h-0.5 bg-amber-500"></span>
      </button>

      {/* Desktop Button */}
      <motion.button
        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(245, 158, 11, 0.4)" }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/signup")}
        className="hidden md:block px-5 py-2 text-sm font-bold text-amber-500 border border-amber-500/50 rounded-lg hover:bg-amber-500/10 transition-all HeadingFont"
      >
        Start Watching
      </motion.button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full right-4 mt-2 w-48 bg-[#18181f] border border-white/10 rounded-xl shadow-lg flex flex-col items-stretch z-50 md:hidden">
          <a href="/dashboard" className="px-6 py-3 text-sm text-gray-200 hover:text-amber-500 transition-colors">Dashboard</a>
          <a href="#features" className="px-6 py-3 text-sm text-gray-200 hover:text-amber-500 transition-colors">Features</a>
          <a href="#pricing" className="px-6 py-3 text-sm text-gray-200 hover:text-amber-500 transition-colors">Pricing</a>
          <a href="#docs" className="px-6 py-3 text-sm text-gray-200 hover:text-amber-500 transition-colors">Docs</a>
          <button
            onClick={() => { setMenuOpen(false); navigate("/signup"); }}
            className="m-3 px-5 py-2 text-sm font-bold text-amber-500 border border-amber-500/50 rounded-lg hover:bg-amber-500/10 transition-all HeadingFont"
          >
            Start Watching
          </button>
        </div>
      )}
    </motion.nav>
  );
};

const Counter = ({ value, duration = 2 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value.replace(/[^0-9.]/g, ""));
    if (start === end) return;

    let totalMiliseconds = duration * 1000;
    let incrementTime = (totalMiliseconds / end) * (end > 100 ? 5 : 1);

    let timer = setInterval(() => {
      start += (end > 100 ? 5 : 0.01);
      if (start >= end) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(value.includes('%') ? start.toFixed(2) + '%' : (value.includes('+') ? Math.floor(start) + 'M+' : Math.floor(start)));
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

const Hero = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/");
    }
    else {
      navigate("/dashboard");
    }
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/30 overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap');
        .HeadingFont { font-family: 'Space Grotesk', sans-serif; }
        .BodyFont { font-family: 'Inter', sans-serif; }
        .hex-grid {
          background-image: radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.05) 1px, transparent 0);
          background-size: 32px 32px;
        }
        .animated-glow {
          background: radial-gradient(circle at center, rgba(245, 158, 11, 0.15) 0%, transparent 70%);
        }
        .text-gradient {
          background: linear-gradient(to right, #f59e0b, #fb923c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      <Nav />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 hex-grid pointer-events-none opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] animated-glow pointer-events-none" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-5xl mx-auto text-center relative z-10"
        >
          <motion.h1 variants={itemVariants} className="text-3xl sm:text-5xl md:text-7xl font-extrabold HeadingFont leading-tight mb-6">
            Your Website Is <br />
            Being <span className="text-gradient">Watched.</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-base sm:text-lg md:text-xl text-gray-400 BodyFont max-w-2xl mx-auto mb-10 leading-relaxed">
            Track uptime, response times, and failures in real-time.
            Get alerted before your users ever notice.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-20">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(245, 158, 11, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/signup")}
              className="w-full sm:w-auto px-8 py-4 bg-amber-500 text-black font-bold rounded-xl transition-all HeadingFont"
            >
              Start Watching
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white font-bold rounded-xl transition-all HeadingFont"
            >
              See It Live
            </motion.button>
          </motion.div>

          {/* Live Stats Bar */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 p-4 sm:p-8 bg-[#111118] border border-white/5 rounded-3xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-right from-transparent via-amber-500/50 to-transparent" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-amber-500 HeadingFont mb-1">
                <Counter value="99.98%" />
              </div>
              <div className="text-xs uppercase tracking-widest text-gray-500 BodyFont">Uptime Tracked</div>
            </div>
            <div className="hidden md:block w-[1px] h-12 bg-white/10 mx-auto self-center" />
            <div className="text-center border-y border-white/5 py-6 md:py-0 md:border-y-0">
              <div className="text-2xl sm:text-3xl font-bold text-amber-500 HeadingFont mb-1">
                <Counter value="1.2M+" />
              </div>
              <div className="text-xs uppercase tracking-widest text-gray-500 BodyFont">Checks Per Day</div>
            </div>
            <div className="hidden md:block w-[1px] h-12 bg-white/10 mx-auto self-center" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-amber-500 HeadingFont mb-1">
                &lt; <Counter value="30s" />
              </div>
              <div className="text-xs uppercase tracking-widest text-gray-500 BodyFont">Alert Time</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-4 sm:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Glow beneath card */}
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[120%] h-64 bg-amber-500/20 blur-[120px] rounded-full" />

            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 p-2 sm:p-4 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-1.5 px-2 sm:px-4 py-3 border-b border-white/5 bg-white/5 rounded-t-xl">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                <div className="ml-2 sm:ml-4 h-4 w-32 sm:w-64 bg-white/5 rounded-full" />
              </div>
              <div className="aspect-video bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full max-w-3xl flex flex-col gap-4 sm:gap-6 p-4 sm:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-end gap-2">
                      <div className="h-8 w-32 sm:w-48 bg-white/10 rounded-lg animate-pulse" />
                      <div className="h-4 w-20 sm:w-32 bg-white/5 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 sm:h-32 bg-white/5 border border-white/5 rounded-xl flex flex-col p-2 sm:p-4 gap-2">
                          <div className="h-3 w-10 sm:w-12 bg-white/10 rounded-full" />
                          <div className="h-6 w-12 sm:w-16 bg-amber-500/40 rounded-lg mt-auto" />
                        </div>
                      ))}
                    </div>
                    <div className="h-40 sm:h-64 bg-white/5 border border-white/5 rounded-xl overflow-hidden relative">
                      <div className="absolute inset-0 flex items-end px-4 sm:px-12 gap-0.5 sm:gap-1 pb-2 sm:pb-4">
                        {[...Array(30)].map((_, i) => (
                          <div key={i} style={{ height: `${Math.random() * 80 + 20}%` }} className="flex-1 bg-amber-500/20 rounded-t-sm" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold HeadingFont mb-4">Command-Level Visibility <br className="hidden md:block" /> Over Every Request</h2>
            <div className="w-16 sm:w-24 h-1 bg-amber-500 mx-auto rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: "🔭", title: "Real-Time Monitoring", desc: "24/7 uptime and response tracking across all your endpoints" },
              { icon: "⚡", title: "Instant Alerts", desc: "Email notifications the moment a site goes down or slows" },
              { icon: "🌐", title: "Global Coverage", desc: "Checks from multiple regions so you catch regional outages fast" }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -10, borderColor: "rgba(245, 158, 11, 0.4)" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="p-6 sm:p-8 bg-[#1a1a24] border border-white/5 rounded-3xl transition-all group overflow-hidden relative"
              >
                <div className="absolute -top-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-colors" />
                <div className="text-3xl sm:text-4xl mb-4 sm:mb-6">{f.icon}</div>
                <h3 className="text-lg sm:text-xl font-bold HeadingFont mb-2 sm:mb-3 group-hover:text-amber-500 transition-colors">{f.title}</h3>
                <p className="text-gray-400 BodyFont leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-8 relative bg-[#0a0a0f]">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold HeadingFont mb-4">No Surprises. Just Clarity.</h2>
            <p className="text-gray-400 BodyFont">Choose the plan that scales with your growth.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {/* Free */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 sm:p-8 bg-[#111118] border border-white/5 rounded-3xl flex flex-col"
            >
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold HeadingFont mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold HeadingFont">$0</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-1">
                {["Monitor 1 site", "Basic uptime checks", "Email alerts"].map((li, i) => (
                  <li key={i} className="flex items-center gap-2 sm:gap-3 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {li}
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/login")}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 border border-white/10 rounded-xl hover:bg-white/5 transition-colors HeadingFont font-bold"
              >
                Get Started Free
              </motion.button>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="p-6 sm:p-8 bg-[#1a1a24] border-2 border-amber-500 rounded-3xl flex flex-col relative"
            >
              <div className="absolute top-0 right-4 sm:right-8 -translate-y-1/2 px-3 sm:px-4 py-1 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                Most Popular
              </div>
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold HeadingFont mb-2 text-amber-500">Pro</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold HeadingFont">$9</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-1">
                {["Up to 5 sites", "Advanced checks", "Instant alerts", "Detailed logs"].map((li, i) => (
                  <li key={i} className="flex items-center gap-2 sm:gap-3 text-sm text-gray-200">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {li}
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(245, 158, 11, 0.4)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/signup")}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-amber-500 text-black rounded-xl font-bold HeadingFont shadow-xl"
              >
                Start Pro Trial
              </motion.button>
            </motion.div>

            {/* Enterprise */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="p-6 sm:p-8 bg-[#111118] border border-white/5 rounded-3xl flex flex-col"
            >
              <div className="mb-6 sm:mb-8">
                <h3 className="text-lg sm:text-xl font-bold HeadingFont mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold HeadingFont">$20</span>
                  <span className="text-gray-500 text-sm">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 sm:space-y-4 mb-8 sm:mb-10 flex-1">
                {["Custom solutions", "Dedicated support", "Unlimited endpoints"].map((li, i) => (
                  <li key={i} className="flex items-center gap-2 sm:gap-3 text-sm text-gray-400">
                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {li}
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 sm:py-4 px-4 sm:px-6 border border-white/10 rounded-xl hover:bg-white/5 transition-colors HeadingFont font-bold"
              >
                Contact Sales
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 px-4 sm:px-8 border-t border-white/5 bg-[#0a0a0f]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-8 mb-8 sm:mb-12">
            <div className="flex flex-col items-center sm:items-start gap-4">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4.5l-7.5 15h15L12 4.5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                <span className="text-lg font-bold tracking-tight text-white HeadingFont">Watchtower</span>
              </div>
              <p className="text-gray-500 text-sm BodyFont">Watching so you don't have to.</p>
            </div>
            <div className="flex gap-6 sm:gap-8 text-sm text-gray-400 BodyFont">
              <a href="#" className="hover:text-amber-500">Security</a>
              <a href="#" className="hover:text-amber-500">Terms</a>
              <a href="#" className="hover:text-amber-500">Privacy</a>
            </div>
          </div>
          <div className="text-center sm:text-left pt-6 sm:pt-8 border-t border-white/5 text-gray-600 text-[10px] uppercase tracking-[0.2em] BodyFont">
            © 2025 Watchtower. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Hero;
