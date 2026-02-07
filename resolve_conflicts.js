const fs = require('fs');
const path = require('path');

function resolveConflicts(filePath) {
    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regex to match Git conflict blocks and keep the HEAD side
    // (?s) is not supported in JS regex directly, so we use [^] or [\s\S] for any character including newline
    // We want to match:
    // <<<<<<< HEAD
    // [KEEP THIS]
    // =======
    // [DISCARD THIS]
    // >>>>>>> [COMMIT_HASH]
    
    const conflictRegex = /<<<<<<< HEAD\r?\n([\s\S]*?)\r?\n=======\r?\n[\s\S]*?\r?\n>>>>>>> [^\r\n]*/g;
    
    const newContent = content.replace(conflictRegex, '$1');
    
    if (content === newContent) {
        // Try a more lenient match for files where maybe ======= or >>>>>>> are missing or slightly different
        // But the user said HEAD should be kept. 
        // If only <<<<<<< HEAD exists (like in StudioView.jsx), we should handle that too.
        
        const partialConflictRegex = /<<<<<<< HEAD\r?\n/g;
        const evenMoreNewContent = content.replace(partialConflictRegex, '');
        if (content !== evenMoreNewContent) {
           fs.writeFileSync(filePath, evenMoreNewContent);
           console.log(`Fixed partial marker in ${filePath}`);
        } else {
           console.log(`No changes made to ${filePath}`);
        }
    } else {
        fs.writeFileSync(filePath, newContent);
        console.log(`Resolved conflicts in ${filePath}`);
    }
}

const files = [
    'backend/server.js',
    'frontend/src/components/StudioView.jsx',
    'frontend/src/components/StudioOrchestratorV2.jsx'
];

files.forEach(file => {
    const fullPath = path.resolve('c:/Users/jari5/studio-agents', file);
    if (fs.existsSync(fullPath)) {
        resolveConflicts(fullPath);
    } else {
        console.log(`File not found: ${fullPath}`);
    }
});
