import fs from 'fs';
import postcss from 'postcss';

const fixCssPlugin = (opts = {}) => {
  return {
    postcssPlugin: 'fix-css',
    Once(root) {
      root.walkDecls((decl) => {
        // 1. Remove !important from most layout classes to fix specificity wars
        if (decl.important) {
          const prop = decl.prop.toLowerCase();
          if (!['display', 'visibility'].includes(prop) || decl.parent.selector.includes('.d-none')) {
            decl.important = false;
          }
        }

        const prop = decl.prop.toLowerCase();

        // 2. Fix iOS zooming bug: Ensure font-size is at least 16px for inputs
        if (prop === 'font-size' && decl.parent && decl.parent.selector && decl.parent.selector.match(/input|textarea|select/i)) {
           if (decl.value === '14px' || decl.value === '15px') {
               decl.value = '16px';
           }
        }

        // 3. Fix safe area insets logic
        if (decl.value.includes('env(safe-area-inset-bottom)')) {
            if (!decl.value.includes('max(') && prop.includes('padding')) {
                decl.value = decl.value.replace(/env\(safe-area-inset-bottom[^)]*\)/g, 'max(16px, env(safe-area-inset-bottom))');
            }
        }
        
        // 4. Standardize transitions as per /ui-ux-pro-max
        if (prop === 'transition') {
            decl.value = decl.value.replace(/\d+ms/g, '200ms').replace(/ease/g, 'cubic-bezier(0.4, 0, 0.2, 1)');
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
