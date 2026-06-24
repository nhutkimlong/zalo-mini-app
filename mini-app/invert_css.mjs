import fs from 'fs';
import postcss from 'postcss';

const layoutProps = [
  'display', 'width', 'max-width', 'min-width', 
  'height', 'min-height', 'max-height', 
  'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
  'grid', 'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'gap',
  'position', 'top', 'bottom', 'left', 'right',
  'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
  'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
  'order', 'align-items', 'justify-content', 'place-items', 'aspect-ratio'
];

const invertCssPlugin = (opts = {}) => {
  return {
    postcssPlugin: 'invert-css',
    Once(root) {
      
      // 1. Strip !important from layout properties
      root.walkDecls((decl) => {
        if (decl.important) {
          const prop = decl.prop.toLowerCase();
          if (layoutProps.includes(prop) || prop.startsWith('margin') || prop.startsWith('padding')) {
            // Keep !important if it's a structural utility like `.d-none` 
            if (!decl.parent.selector.includes('.d-none') && !decl.parent.selector.includes('.hidden')) {
              decl.important = false;
            }
          }
        }
      });

      // 2. Invert max-width media queries
      const mediaRulesToProcess = [];
      root.walkAtRules('media', (rule) => {
        const match = rule.params.match(/max-width:\s*(\d+)px/);
        if (match) {
           mediaRulesToProcess.push({ rule, width: parseInt(match[1], 10) });
        }
      });

      for (const { rule, width } of mediaRulesToProcess) {
         // Create the new min-width media query for desktop/tablet styles
         const minWidth = width + 1;
         let newParams = rule.params.replace(/max-width:\s*\d+px/, `min-width: ${minWidth}px`);
         
         const minWidthMedia = postcss.atRule({ name: 'media', params: newParams });
         
         rule.walkRules(innerRule => {
           const selector = innerRule.selector;
           
           // Find matching base rule at the root level
           let baseRule = null;
           root.walkRules(rootRule => {
              if (rootRule.parent === root && rootRule.selector === selector) {
                  baseRule = rootRule;
              }
           });

           if (baseRule) {
               const newDesktopRule = postcss.rule({ selector });
               
               innerRule.walkDecls(innerDecl => {
                   let foundBaseDecl = false;
                   // Look for the same property in the base rule
                   baseRule.walkDecls(innerDecl.prop, baseDecl => {
                       newDesktopRule.append(baseDecl.clone());
                       baseDecl.remove(); // Remove desktop prop from base
                       foundBaseDecl = true;
                   });
                   
                   // Add the mobile prop to the base rule
                   baseRule.append(innerDecl.clone());
               });
               
               if (newDesktopRule.nodes && newDesktopRule.nodes.length > 0) {
                   minWidthMedia.append(newDesktopRule);
               }
           } else {
               // If there was no base rule overriding it, just hoist the mobile rules to root
               root.append(innerRule.clone());
           }
         });
         
         if (minWidthMedia.nodes && minWidthMedia.nodes.length > 0) {
             rule.parent.insertBefore(rule, minWidthMedia);
         }
         // Remove the original max-width query
         rule.remove();
      }
    }
  };
};
invertCssPlugin.postcss = true;

async function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const css = fs.readFileSync(filePath, 'utf8');
  const result = await postcss([invertCssPlugin]).process(css, { from: filePath, to: filePath });
  fs.writeFileSync(filePath, result.css);
  console.log(`Processed ${filePath}`);
}

async function main() {
  await processFile('src/index.css');
  await processFile('src/standalone.css');
  await processFile('src/enhancements.css');
}

main().catch(console.error);
