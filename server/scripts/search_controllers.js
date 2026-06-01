import fs from 'fs';
import path from 'path';

const searchDir = (dir, pattern) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            searchDir(fullPath, pattern);
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes(pattern.toLowerCase())) {
                console.log(`Found pattern in: ${fullPath}`);
            }
        }
    }
};

console.log("Searching for 'return_requests' in server/controllers...");
searchDir('d:\\GoMo Deals\\server\\controllers', 'return_requests');

console.log("\nSearching for 'return_requests' in server/routes...");
searchDir('d:\\GoMo Deals\\server\\routes', 'return_requests');

console.log("\nSearching for 'return' in server/routes...");
searchDir('d:\\GoMo Deals\\server\\routes', 'return');
