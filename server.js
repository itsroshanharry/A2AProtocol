const express = require('express');
const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Agent card endpoint
app.get('/.well-known/agent-card.json', (req, res) => {
  res.json({
    name: "Hello World Agent",
    version: "1.0.0",
    description: "A simple agent that greets users",
    url: "https://a2aprotocol.onrender.com/rpc",
    skills: [
      {
        name: "greet",
        description: "Greets a user by name",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the person to greet"
            }
          },
          required: ["name"]
        }
      }
    ]
  });
});

// Handle JSON-RPC request
function handleRPC(req, res) {
  console.log('Received request:', JSON.stringify(req.body, null, 2));

  const { jsonrpc, method, params, id } = req.body;

  // Handle non-standard format
  if (!jsonrpc && !method) {
    if (req.body.skill || req.body.name) {
      const name = req.body.name || (req.body.input && req.body.input.name) || "stranger";
      
      return res.json({
        jsonrpc: "2.0",
        result: {
          type: "message",
          content: {
            type: "text",
            text: `Hello, ${name}! Welcome to the A2A world! 👋`
          }
        },
        id: req.body.id || 1
      });
    }
  }

  if (jsonrpc !== "2.0") {
    return res.json({
      jsonrpc: "2.0",
      error: { code: -32600, message: "Invalid Request" },
      id
    });
  }

  if (method === "message/send") {
    const { skill, input } = params;

    if (skill === "greet") {
      const name = input.name || "stranger";
      
      return res.json({
        jsonrpc: "2.0",
        result: {
          type: "message",
          content: {
            type: "text",
            text: `Hello, ${name}! Welcome to the A2A world! 👋`
          }
        },
        id
      });
    }

    return res.json({
      jsonrpc: "2.0",
      error: { code: -32601, message: "Unknown skill" },
      id
    });
  }

  return res.json({
    jsonrpc: "2.0",
    error: { code: -32601, message: "Method not found" },
    id
  });
}

// JSON-RPC endpoints
app.post('/rpc', handleRPC);
app.post('/rpc/execute', handleRPC);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Agent running on port ${PORT}`);
});