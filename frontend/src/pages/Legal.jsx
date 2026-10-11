import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CONTACT = "[contact email]";

const PAGES = {
  terms: {
    title: "Terms of Service",
    sections: [
      ["Using Watchtower", "Watchtower lets you monitor the availability and response time of websites you own or are authorised to monitor. You are responsible for the sites you add and for keeping your account credentials safe."],
      ["Acceptable use", "Do not use Watchtower to monitor sites you do not have permission to monitor, to attack or overload any service, or to break the law."],
      ["Beta service", "Watchtower is currently in beta and is provided free of charge and \"as is\". Features may change, and we do not guarantee that checks or alerts will always be delivered on time or at all."],
      ["Changes", "We may update these terms. If we make material changes we will update this page."],
      ["Contact", `Questions about these terms: ${CONTACT}.`],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    sections: [
      ["What we collect", "Your name and email address when you sign up, the websites you add to monitor, and the results of the checks we run on them (such as status and response time)."],
      ["How we use it", "To run your monitors, show you charts and logs, and send you email alerts when a site goes down. We use your email address to contact you about your account and alerts."],
      ["Sharing", "We do not sell your personal information."],
      ["Your choices", `You can ask us to delete your account and data at any time by contacting ${CONTACT}.`],
      ["Changes", "We may update this policy and will post changes on this page."],
    ],
  },
  security: {
    title: "Security",
    sections: [
      ["Our approach", "We aim to keep your account and monitoring data safe, and we improve our practices as Watchtower grows."],
      ["Account safety", "Use a strong, unique password and do not share your credentials. Sign out on shared devices."],
      ["Reporting a vulnerability", `If you believe you have found a security issue, please email ${CONTACT} with the details. Please give us reasonable time to fix it before disclosing it publicly.`],
    ],
  },
};

const Legal = ({ page }) => {
  const { title, sections } = PAGES[page];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-amber-500/30 px-4 sm:px-8 py-12">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500&display=swap');
        .HeadingFont { font-family: 'Space Grotesk', sans-serif; }
        .BodyFont { font-family: 'Inter', sans-serif; }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-500 transition-colors BodyFont mb-10">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Watchtower
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold HeadingFont tracking-tight mb-4">{title}</h1>

        <div className="mb-10 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200/90 BodyFont">
          Draft placeholder. This text is a starting point and has not been reviewed by a lawyer. Replace it before launch.
        </div>

        <div className="space-y-8">
          {sections.map(([heading, body]) => (
            <section key={heading}>
              <h2 className="text-xl font-bold HeadingFont mb-2">{heading}</h2>
              <p className="text-gray-400 BodyFont leading-relaxed">{body}</p>
            </section>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Legal;
