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

  req.headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0';
  req.headers['accept'] = '*/*';
  req.headers['accept-language'] = 'en-US,en;q=0.5';
  req.headers['accept-encoding'] = 'gzip, deflate, br, zstd';
  req.headers['dnt'] = '1';
  req.headers['sec-gpc'] = '1';
  req.headers['alt-used'] = 'dbx.molystream.org';
  req.headers['connection'] = 'keep-alive';
  req.headers['referer'] = 'https://dbx.molystream.org/embed/6866-677533addec05f7cc31e7c77';
  req.headers['cookie'] = 'cf_clearance=S6cffb.dyhjMhkTMcTthxI8EnYWMQQSsYU0cKchMNX0-1736212768-1.2.1.1-Z.kxMDIUMoIFDTgBOGr5_CtBHo8Jai9R9hteGsCg2.y7skBvQIlceOSexQoCeRDyktbDuQql9pSH.4IDKAIblAfx2qt53nlZyN5iwdntcM9x7M4OBBo_hUWMIjRjQygydXoSe3Ich19Hx99ebPi88kpzlk8yH5cv4nzRjMWgTRbpD2aozdQbJnIqx_p5CH7lAHGoe8eVqQke4B0IkMMhkyIWymY.s6f4cPm9Fcu8_SUBHz2Mg7f9yeTkyUGkYahmcxg9QEeipB0spG5Ekysnl6SFTPNjvVrsOwlyZXXJZU7gAyWKSrSBLVqBakqzcjLwZG3QyMjnTXZaxsGQdt5aDw';
  req.headers['sec-fetch-dest'] = 'empty';
  req.headers['sec-fetch-mode'] = 'cors';
  req.headers['sec-fetch-site'] = 'same-origin';
  req.headers['te'] = 'trailers';

  // Handle the request
  server.emit('request', req, res);
};
