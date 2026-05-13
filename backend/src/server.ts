import app from './app';
import http from 'http';

const port = 3000;

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`we are up in port ${port}`);
});