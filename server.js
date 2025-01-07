// Listen on a specific host via the HOST environment variable
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
const port = process.env.PORT || 3000; // Vercel'de port genelde 3000'dir.

const corsAnywhere = require('./lib/cors-anywhere');

// Parse environment variables for blacklist and whitelist
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

// Rate-limiting to avoid abuse
const checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

// Proxy Server Configuration
const server = corsAnywhere.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    xfwd: false,
  },
});

// Vercel-specific export
module.exports = (req, res) => {
  server.emit('request', req, res);
};
