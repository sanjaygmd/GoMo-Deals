import fs from 'fs';

const content = fs.readFileSync('d:\\GoMo Deals\\server\\controllers\\OrderController.js', 'utf8');
const lines = content.split('\n');

let startIndex = -1;
let openBraces = 0;
let inFunc = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('export const createReturnRequest')) {
        startIndex = i;
        inFunc = true;
        console.log(`Found starting at line ${i + 1}`);
    }
    if (inFunc) {
        console.log(`${i + 1}: ${line}`);
        const openMatches = line.match(/{/g);
        const closeMatches = line.match(/}/g);
        if (openMatches) openBraces += openMatches.length;
        if (closeMatches) openBraces -= closeMatches.length;
        if (openBraces === 0 && line.includes('}')) {
            inFunc = false;
            break;
        }
    }
}
