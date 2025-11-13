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

  const body = req.body;

  // Format 1: Amethyst's custom format
  // {"input": {"name": "john"}, "requestedAction": "greetuser"}
  if (body.input && body.requestedAction) {
    const name = body.input.name || "stranger";
    
    return res.json({
      success: true,
      result: `Hello, ${name}! Welcome to the A2A world! 👋`
    });
  }

  // Format 2: Amethyst's JSON-RPC format with nested message
  // {"jsonrpc": "2.0", "method": "message/send", "params": {"message": {...}, "metadata": {...}}}
  if (body.jsonrpc === "2.0" && body.method === "message/send") {
    // Extract the name from the nested message parts
    let name = "stranger";
    
    if (body.params && body.params.message && body.params.message.parts) {
      const textPart = body.params.message.parts.find(p => p.kind === "text");
      if (textPart && textPart.text) {
        try {
          const parsed = JSON.parse(textPart.text);
          name = parsed.name || "stranger";
        } catch (e) {
          console.log('Could not parse text part:', textPart.text);
        }
      }
    }
    
    return res.json({
      jsonrpc: "2.0",
      result: {
        type: "message",
        content: {
          type: "text",
          text: `Hello, ${name}! Welcome to the A2A world! 👋`
        }
      },
      id: body.id
    });
  }

  // Format 3: Standard A2A JSON-RPC format
  // {"jsonrpc": "2.0", "method": "message/send", "params": {"skill": "greet", "input": {"name": "john"}}}
  if (body.jsonrpc === "2.0" && body.method === "message/send" && body.params && body.params.skill) {
    const { skill, input } = body.params;

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
        id: body.id
      });
    }
  }

  // Unknown format
  return res.json({
    jsonrpc: "2.0",
    error: { code: -32600, message: "Invalid Request" },
    id: body.id
  });
}

// JSON-RPC endpoints
app.post('/rpc', handleRPC);
app.post('/rpc/execute', handleRPC);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Agent running on port ${PORT}`);
});