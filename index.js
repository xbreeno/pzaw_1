import { createServer } from 'node:http';
import { handlePath } from './src/path_handlers.js';
import { URL } from 'node:url';

const server = createServer((req, res) => {
    const request_url = new URL(`http://${host}${req.url}`);
    handlePath(request_url.pathname, req, res);
});

const host = 'localhost';
const port = 8000;


server.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`);
});
