const nacl = require('tweetnacl');
const http = require('http');

exports.handler = async function(event){
  const isVerified = nacl.sign.detached.verify(
    Buffer.from(event.headers['x-signature-timestamp'] + event.body),
    Buffer.from(event.headers['x-signature-ed25519'], 'hex'),
    Buffer.from(process.env.DISCORD_BOT_PUBLIC_KEY, 'hex')
  );
  if (!isVerified) return {
    statusCode: 401,
    body: 'invalid request signature'
  };

  const json = JSON.parse(event.body);
  if (json.type === 1) return {
    statusCode: 200,
    body: JSON.stringify({ type: 1 })
  };

  const req = http.request('https://data.mongodb-api.com/app/kittenlocks-gcfgb/endpoint/superkittenbot',
                           { method: 'POST', headers: { 'Content-Type': 'application/json' } });
  req.write(event.body);
  req.end();
  return {
    statusCode: 200,
    body: JSON.stringify({ type: 5 })
  };
};