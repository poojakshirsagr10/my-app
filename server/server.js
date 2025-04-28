const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 4000 });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // Attach unique id if cursor
    if (data.type === 'cursor') {
      data.userId = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
    }

    // Broadcast to others
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });
});

console.log('WebSocket server running on ws://localhost:4000');
