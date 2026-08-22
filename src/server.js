const { createApp } = require('./app');
const { loadConfig } = require('./config');

const config = loadConfig();
const app = createApp(config);

app.listen(config.server.port, () => {
  console.log(`Email middleware listening on port ${config.server.port}`);
  console.log(`Using config: ${config.__source}`);
});
