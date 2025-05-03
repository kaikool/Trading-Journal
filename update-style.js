/**
 * Script to update inline styles in TradeFormNew.tsx with CSS classes
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the file
const filePath = path.join(__dirname, 'client', 'src', 'components', 'trades', 'TradeFormNew.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all instances of the inline style
const oldStyle = 'style={{ opacity: 0, transition: "opacity 0.3s ease-in-out", maxWidth: "100%" }}';
const newStyle = 'className="trade-image"';

content = content.split(oldStyle).join(newStyle);

// Update imgElement.style.opacity = "1" with imgElement.classList.add("loaded")
content = content.replace(/imgElement\.style\.opacity = "1"/g, 'imgElement.classList.add("loaded")');

// Write the file back
fs.writeFileSync(filePath, content);

console.log('Successfully updated TradeFormNew.tsx');