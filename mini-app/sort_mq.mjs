import postcss from 'postcss';
import sortMediaQueries from 'postcss-sort-media-queries';
import fs from 'fs';

const css = fs.readFileSync('src/app-core.css', 'utf8');

postcss([
  sortMediaQueries({
    sort: 'mobile-first' // default sorting order
  })
])
.process(css, { from: 'src/app-core.css', to: 'src/app-core.css' })
.then(result => {
  fs.writeFileSync('src/app-core.css', result.css);
  console.log('Media queries sorted and consolidated.');
})
.catch(err => {
  console.error(err);
});
