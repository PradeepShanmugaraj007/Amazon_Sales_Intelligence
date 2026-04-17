const fs = require('fs');
const path = 'c:/Users/ajaia/OneDrive/Attachments/Desktop/amazon/Amazon_Sales_Intelligence/frontend/src/Dashboard.jsx';
const content = fs.readFileSync(path, 'utf8').split('\n');

// We want to insert a </div> at line 498 (index 497)
// Line 497 was '            </div>'
// Line 498 was '            )'
content.splice(497, 0, '            </div>');

fs.writeFileSync(path, content.join('\n'));
console.log('Fixed tag balance');
