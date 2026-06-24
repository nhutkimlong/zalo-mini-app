import fs from 'fs';

let css = fs.readFileSync('src/app.module.css', 'utf8');

css = css.replace(/#app\b/g, ':global(#app)');
css = css.replace(/#map-bottom-sheet\b/g, ':global(#map-bottom-sheet)');
css = css.replace(/#zma-container\b/g, ':global(#zma-container)');

fs.writeFileSync('src/app.module.css', css);
console.log('Fixed IDs in app.module.css');
