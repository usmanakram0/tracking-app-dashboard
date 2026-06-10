import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  safelist: [
    { pattern: /^gap-(0|0\.5|1|1\.5|2|2\.5|3|4|5|6|8)$/ },
    { pattern: /^p(x|y|t|b|l|r)?-(0|0\.5|1|1\.5|2|2\.5|3|4|5|6|8|16|24)$/ },
    { pattern: /^m(x|y|t|b|l|r)?-(0|0\.5|1|1\.5|2|2\.5|3|4|5|6|8)$/ },
    { pattern: /^space-(x|y)-(0|1|2|3|4|5|6|8)$/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
