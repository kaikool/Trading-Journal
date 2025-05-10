const fs = require('fs');
const path = require('path');

// Đường dẫn đến file
const filePath = path.join(process.cwd(), 'client/src/components/goals/GoalList.tsx');

// Đọc nội dung file
let content = fs.readFileSync(filePath, 'utf8');

// Thay thế tất cả các trường hợp của pr-4 thành px-4 trong ScrollArea
content = content.replace(/<ScrollArea className="h-full pr-4">/g, '<ScrollArea className="h-full px-4">');

// Ghi nội dung mới vào file
fs.writeFileSync(filePath, content);

console.log('Đã thay thế pr-4 thành px-4 trong ScrollArea');
