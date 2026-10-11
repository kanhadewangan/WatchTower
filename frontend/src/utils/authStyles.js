export const authInputClasses = (hasError) =>
  `w-full px-4 py-3.5 bg-white/[0.04] border ${
    hasError ? "border-red-500/50" : "border-white/10"
  } rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 hover:border-white/20 transition-all duration-200 BodyFont`;
