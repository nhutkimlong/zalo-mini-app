import { Project, SyntaxKind } from 'ts-morph';
import path from 'path';
import fs from 'fs';

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

// We only want to process files in src/pages and src/components, and App.tsx, main.tsx
const sourceFiles = project.getSourceFiles().filter(f => {
  const fp = f.getFilePath();
  return fp.includes('/src/pages/') || fp.includes('/src/components/') || fp.endsWith('App.tsx') || fp.endsWith('main.tsx');
});

for (const sourceFile of sourceFiles) {
  let changed = false;

  // Find all JSX Attributes named "className"
  const classNameAttributes = sourceFile.getDescendantsOfKind(SyntaxKind.JsxAttribute)
    .filter(attr => attr.getNameNode().getText() === 'className');

  if (classNameAttributes.length > 0) {
    changed = true;
    for (const attr of classNameAttributes) {
      const initializer = attr.getInitializer();
      if (!initializer) continue;

      if (initializer.getKind() === SyntaxKind.StringLiteral) {
        // className="foo bar"
        const text = initializer.getText(); // e.g. "foo bar"
        attr.setInitializer(`{cx(styles, ${text})}`);
      } else if (initializer.getKind() === SyntaxKind.JsxExpression) {
        // className={...}
        const expression = initializer.getExpression();
        if (expression) {
          const text = expression.getText();
          if (!text.startsWith('cx(')) {
            attr.setInitializer(`{cx(styles, ${text})}`);
          }
        }
      }
    }

    // Add imports if not exist
    const hasCxImport = sourceFile.getImportDeclarations().some(imp => imp.getModuleSpecifierValue().endsWith('utils/cx'));
    if (!hasCxImport) {
      const depth = sourceFile.getFilePath().split('/src/')[1].split('/').length - 1;
      const prefix = depth > 0 ? '../'.repeat(depth) : './';
      
      sourceFile.addImportDeclaration({
        defaultImport: 'cx',
        moduleSpecifier: `${prefix}utils/cx`
      });
      sourceFile.addImportDeclaration({
        defaultImport: 'styles',
        moduleSpecifier: `${prefix}app.module.css`
      });
    }
  }

  if (changed) {
    sourceFile.saveSync();
    console.log('Updated:', sourceFile.getFilePath());
  }
}
