const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve everything from the project root as static files
app.use(express.static(path.join(__dirname)));

// SPA fallback — always return index.html for unknown paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Iron Gate Logistics running on port ${PORT}`);
});
