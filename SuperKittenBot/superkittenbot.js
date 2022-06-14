/* eslint-disable unicorn/filename-case, camelcase */
/* eslint-env node */
import { sign } from 'tweetnacl';
import fetch from 'node-fetch';

function formatTime(t){
  if (t > 60 * 60 * 24) return `${Math.floor(t / (60 * 60 * 24))}d ${Math.floor(t / (60 * 60)) % 24}h ago`;
  if (t > 60 * 60) return `${Math.floor(t / (60 * 60))}h ${Math.floor(t / 60) % 60}m ago`;
  if (t > 60) return `${Math.floor(t / 60)}m ${t % 60}s ago`;
  return `${t}s ago`;
}

async function handleChaster(json){
  const target = json.data.options?.find(e => e.name === 'user')?.value;
  const user = target || json.member.user.id;
  const [res, dis] = await Promise.all([
    fetch(`https://api.chaster.app/users/search/by-discord-id/${user}`, { headers: { Authorization: `Bearer ${process.env.CHASTER_DEV_TOKEN}` } }).then(d => d.json()),
    target ? fetch(`https://discord.com/api/v8/users/${user}`, { headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` } }).then(d => d.json()) : json.member.user
  ]);
  const result = {
    type: 4,
    data: {
      embeds: [
        {
          title: `${res.username}'s Chaster profile`,
          url: `https://chaster.app/user/${res.username}`,
          timestamp: new Date().toISOString(),
          color: 0x272533,
          thumbnail: { url: res.avatarUrl },
          footer: {
            text: `requested by ${json.member.nick || json.member.user.username}`,
            icon_url: `https://cdn.discordapp.com/avatars/${json.member.user.id}/${json.member.user.avatar}.png`
          },
          author: {
            name: `${dis.username}`,
            url: `https://discord.com/users/${dis.id}`,
            icon_url: `https://cdn.discordapp.com/avatars/${dis.id}/${dis.avatar}.png`
          },
          description: res.description,
          fields: [
            { name: 'Role', value: `${res.role}`, inline: true },
            { name: 'Gender', value: `${res.gender}`, inline: true },
            { name: 'Location', value: `${res.fullLocation}`, inline: true },
            { name: 'Age', value: `${res.age}`, inline: true },
            { name: 'Chaster Plus', value: `${res.isPremium}`, inline: true },
            { name: 'Findom', value: `${res.isFindom}`, inline: true },
            { name: 'Online', value: res.online ? 'true' : (res.lastSeen ? formatTime(res.lastSeen) : 'false'), inline: true },
            { name: 'Team', value: res.isAdmin ? 'Admin' : (res.isModerator ? 'Moderator' : 'false'), inline: true },
            { name: 'Status', value: res.isDisabled ? 'Disabled' : (res.isSuspended ? 'Suspended' : 'Enabled'), inline: true },
            { name: 'Locktober 2020 Points', value: `${res.metadata.locktober2020Points}`, inline: true },
            { name: 'Locktober 2021 Points', value: `${res.metadata.locktober2021Points}`, inline: true },
            { name: 'Chastity Month Points', value: `${res.metadata.chastityMonth2022Points}`, inline: true },
            { name: 'Discord', value: res.discordId ? `<@${res.discordId}> (${res.discordUsername})` : 'not linked', inline: true },
            { name: 'Features', value: res.features.length > 0 ? `${res.features.join(', ')}` : 'none', inline: true },
            { name: 'ID', value: `\`${res._id}\``, inline: true }
          ]
        }
      ],
      components: [
        { type: 1, components: [
          { type: 2, style: 1, label: 'Load stats...', custom_id: `stats-${res._id}`, disabled: true },
          { type: 2, style: 1, label: 'Load locks...', custom_id: `locks-${res._id}`, disabled: true },
          { type: 2, style: 1, label: 'Load shared locks...', custom_id: `shared-${res._id}`, disabled: true }
        ] },
        { type: 1, components: [
          { type: 2, style: 5, label: 'Chaster profile', url: `https://chaster.app/user/${res.username}` },
          { type: 2, style: 5, label: 'KittenLocks profile', url: `https://www.kittenlocks.de/locks/${res.username}` }
        ] }
      ]
    }
  };
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result)
  };
}

export async function handler({ body, headers }){ // eslint-disable-line require-await
  console.log('Using Node.Js verssion:', process.version);
  const isVerified = sign.detached.verify(Buffer.from(headers['x-signature-timestamp'] + body),
                                          Buffer.from(headers['x-signature-ed25519'], 'hex'),
                                          Buffer.from(process.env.DISCORD_BOT_PUBLIC_KEY, 'hex'));
  if (!isVerified) return { statusCode: 401, body: 'invalid request signature' };

  const json = JSON.parse(body);
  console.log(json);
  console.log(json.data.options);

  if (json.type === 1) return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 1 }) };
  if (json.data.name === 'profile'){
    return handleChaster(json);
  }

  fetch('https://data.mongodb-api.com/app/kittenlocks-gcfgb/endpoint/superkittenbot',
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 5 })
  };
}