const http = require('http');
const app = require('./app');

const port = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(port);

console.log('listening port', port)



// "fs": "0.0.1-security",
// "fs-extra": "^8.1.0",
// "handlebars": "^4.3.4",
// "moment": "^2.24.0",
// "mongoose": "^5.7.1",
// "morgan": "^1.9.1",
// "node-cron": "^2.0.3",
// "path": "^0.12.7",
// "pdf-poppler": "^0.2.1",
