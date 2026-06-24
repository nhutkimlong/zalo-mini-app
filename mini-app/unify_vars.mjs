import fs from 'fs';

let css = fs.readFileSync('src/app-core.css', 'utf8');

const variableMapping = {
  '--primary-navy': '--site-navy',
  '--secondary-blue': '--site-blue',
  '--accent-gold': '--site-gold',
  '--accent-gold-dark': '--site-gold',
  '--accent-gold-light': '--gold-soft',
  '--light-bg': '--surface-0',
  '--cream-white': '--surface-1',
  '--dark-text': '--ink-strong',
  '--light-text': '--ink-soft',
  '--muted-text': '--site-muted',
  '--glass-bg': '--site-card',
  '--glass-border': '--line-soft',
  '--shadow-md': '--site-soft-shadow',
  '--shadow-lg': '--site-shadow',
  '--shadow-elevated': '--site-shadow',
  '--radius-md': '--site-radius-sm',
  '--radius-lg': '--site-radius',
  '--site-ink': '--ink-strong',
  '--site-text': '--ink-body',
  '--site-paper': '--surface-0',
  '--site-mist': '--line-soft',
  '--gold-strong': '--site-gold'
};

// Replace variable usages
for (const [oldVar, newVar] of Object.entries(variableMapping)) {
  const regex = new RegExp(`var\\(${oldVar}\\)`, 'g');
  css = css.replace(regex, `var(${newVar})`);
}

fs.writeFileSync('src/app-core.css', css);
console.log('Variables unified successfully in app-core.css');
