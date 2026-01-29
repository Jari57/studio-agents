const fs = require('fs');

const content = fs.readFileSync('backend/server.js', 'utf8');
const lines = content.split('\n');

let currentFunction = null;
let dbDefinedInFunction = false;

lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Simple regex to detect start of a function or arrow function
    if (line.includes('function') || line.includes('=>')) {
        currentFunction = line.trim();
        dbDefinedInFunction = false;
    }
    
    if (line.includes('const db =') || line.includes('let db =') || line.includes('var db =')) {
        dbDefinedInFunction = true;
    }
    
    if (line.includes('db.') && !line.includes('const db') && !line.includes('let db') && !line.includes('var db')) {
        if (!dbDefinedInFunction) {
            console.log(`Potential missing 'db' declaration at line ${lineNumber}: ${line.trim()}`);
        }
    }
});
