const corsAnywhere = require('./lib/cors-anywhere');

// Listen on a specific host and port
const host = process.env.HOST || '0.0.0.0';
const port = process.env.PORT || 3000;

// Parse environment variables for blacklist and whitelist
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

const originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
const originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);

// Rate limiting to avoid abuse
const checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

// CORS Anywhere server
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

// Middleware to fix malformed URLs
module.exports = (req, res) => {
  // Fix malformed URLs (e.g., https:/example.com -> https://example.com)
  if (req.url.startsWith('/http:/') || req.url.startsWith('/https:/')) {
    req.url = req.url.replace('/http:/', '/http://').replace('/https:/', '/https://');
  }

  // Handle the request
  server.emit('request', req, res);
};
