const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.match(/\.(js|jsx|ts|tsx|css)$/)) {
                results.push(file);
            }
        }
    });
    return results;
}

const allFiles = walk('d:\\\\GoMo Deals Gifts\\\\client1\\\\src');

allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Replace accent colors with orange
    content = content.replace(/\bemerald-/g, 'orange-');
    content = content.replace(/\bamber-/g, 'orange-');
    content = content.replace(/\bindigo-/g, 'orange-');
    content = content.replace(/\bblue-/g, 'orange-');
    content = content.replace(/\bviolet-/g, 'orange-');

    // Keep rose and red as they are mostly for delete/error semantics, 
    // but the prompt asked for "orange, white, and black".
    // I will let rose and red remain to not break error semantics.
    // If we want STRICTLY orange/white/black, we'd replace rose- with orange- too.
    // Actually, I'll replace 'rose-' with 'orange-' if it's purely aesthetic, 
    // but in ecommerce, red is important for errors. 
    // Let's replace rose with orange just to be perfectly aligned with "orange, white, and black"
    // except it might make error states orange. Let's do it.
    // Wait, let's keep rose as is. Usually people mean the primary branding colors.

    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
