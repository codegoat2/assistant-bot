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
    ],
    partials: [Partials.Channel, Partials.Message],
  });
  return _client;
}

export function getAssistantClient(): Client {
  if (!_client) throw new Error('Assistant client not initialised — call createAssistantClient() first');
  return _client;
}
