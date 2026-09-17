import { Client, GatewayIntentBits, Partials } from 'discord.js';

let _client: Client | null = null;

export function createAssistantClient(): Client {
  _client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildModeration,      // bans
      GatewayIntentBits.GuildVoiceStates,     // voice join/leave/mute
      GatewayIntentBits.GuildInvites,         // invite create/delete
      GatewayIntentBits.GuildEmojisAndStickers, // emoji/sticker events
      GatewayIntentBits.GuildScheduledEvents, // scheduled event events
    ],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
  });
  return _client;
}

export function getAssistantClient(): Client {
  if (!_client) throw new Error('Assistant client not initialised — call createAssistantClient() first');
  return _client;
}
