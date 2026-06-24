import fs from 'fs';

let css = fs.readFileSync('src/app-core.css', 'utf8');

const variablesToRemove = [
  '--primary-navy',
  '--secondary-blue',
  '--accent-gold',
  '--accent-gold-dark',
  '--accent-gold-light',
  '--light-bg',
  '--cream-white',
  '--dark-text',
  '--light-text',
  '--muted-text',
  '--glass-bg',
  '--glass-border',
  '--shadow-md',
  '--shadow-lg',
  '--shadow-elevated',
  '--radius-md',
  '--radius-lg',
  '--site-ink',
  '--site-text',
  '--site-paper',
  '--site-mist',
  '--gold-strong'
];

for (const v of variablesToRemove) {
  // Matches `--var-name: something;` safely inside :root
  const regex = new RegExp(`\\s+${v}\\s*:\\s*[^;]+;`, 'g');
  css = css.replace(regex, '');
}

fs.writeFileSync('src/app-core.css', css);
console.log('Cleaned up :root variables.');
