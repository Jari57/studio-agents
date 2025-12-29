
const fs = require('fs');

function checkCss(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let openBraces = 0;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        // Remove comments
        line = line.replace(/\/\*.*?\*\//g, '');
        
        // Count braces
        const open = (line.match(/\{/g) || []).length;
        const close = (line.match(/\}/g) || []).length;
        
        openBraces += open;
        openBraces -= close;
        
        if (openBraces < 0) {
            console.log(`Error: Extra closing brace at line ${i+1}`);
            return;
        }

        // Check for property outside block
        if (openBraces === 0 && line.includes(':') && line.endsWith(';') && !line.startsWith('@')) {
             // Heuristic: properties usually have space after colon
             if (line.includes(': ')) {
                 console.log(`Suspicious property outside block at line ${i+1}: ${line}`);
             }
        }
    }

    if (openBraces > 0) {
        console.log(`Error: Missing closing brace(s). Open count: ${openBraces}`);
    } else {
        console.log("Brace count is balanced.");
    }
}

checkCss('frontend/src/App.css');
