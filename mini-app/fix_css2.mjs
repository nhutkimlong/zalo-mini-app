import fs from 'fs';
import postcss from 'postcss';

const fixCssPlugin = (opts = {}) => {
  return {
    postcssPlugin: 'fix-css-2',
    Once(root) {
      root.walkDecls((decl) => {
        const prop = decl.prop.toLowerCase();
        
        // 1. Fix safe area insets logic
        // Zalo Mini App variable overrides
        if (prop === '--kbd-safe-bottom' && decl.value.includes('env(safe-area-inset-bottom)')) {
            if (!decl.value.includes('max(')) {
                decl.value = 'max(16px, env(safe-area-inset-bottom, 0px))';
            }
        }
        
        if (decl.value.includes('env(safe-area-inset-bottom)') && prop.includes('padding')) {
            if (!decl.value.includes('max(')) {
                decl.value = decl.value.replace(/env\(safe-area-inset-bottom[^)]*\)/g, 'max(16px, env(safe-area-inset-bottom))');
            }
        }
        
        // 2. Fix transition logic again just in case there were multiple
        if (prop === 'transition') {
            if (!decl.value.includes('cubic-bezier(0.4, 0, 0.2, 1)')) {
                decl.value = decl.value.replace(/\d+ms/g, '200ms').replace(/ease(?![^()]*\))/g, 'cubic-bezier(0.4, 0, 0.2, 1)');
            }
        }
      });
    }
  };
};
fixCssPlugin.postcss = true;

async function processFile(filePath) {
  const css = fs.readFileSync(filePath, 'utf8');
  const result = await postcss([fixCssPlugin]).process(css, { from: filePath, to: filePath });
  fs.writeFileSync(filePath, result.css);
  console.log(`Processed ${filePath}`);
}

async function main() {
  await processFile('src/standalone.css');
  await processFile('src/enhancements.css');
  await processFile('src/index.css');
}

main().catch(console.error);
