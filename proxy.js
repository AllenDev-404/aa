const http = require('http');
const https = require('https');

const stations = {
  '/loveradio': 'https://stream.zeno.fm/2ss1hgnu6hhvv',
  '/christmas': 'https://us1.amfmph.com/ssl/christmasradio?mp=/stream',
};

http.createServer((req, res) => {

  // Health check route
  if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ESP32 Radio Proxy is running!');
    return;
  }

  const target = stations[req.url];

  if (!target) {
    res.writeHead(404);
    res.end();
    return;
  }

  console.log(`Streaming: ${req.url}`);

  res.writeHead(200, {
    'Content-Type': 'audio/mpeg'
  });

  const fetchStream = (url, redirects = 5) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Icy-MetaData': '0'
      }
    }, (upstream) => {

      // Handle redirects
      if ([301, 302, 303, 307, 308].includes(upstream.statusCode)) {
        if (redirects > 0 && upstream.headers.location) {
          fetchStream(upstream.headers.location, redirects - 1);
        } else {
          res.end();
        }
        return;
      }

      upstream.pipe(res);

      upstream.on('error', () => {
        res.end();
      });

    }).on('error', () => {
      res.end();
    });
  };

  fetchStream(target);

}).listen(process.env.PORT || 8888, () => {
  console.log('Proxy live!');
});
