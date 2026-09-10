import dotenv from 'dotenv';
dotenv.config();

export const config = {
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
  DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || '',
  GIVEAWAY_CHANNEL_ID: process.env.GIVEAWAY_CHANNEL_ID || '',
  ANNOUNCEMENT_CHANNEL_ID: process.env.ANNOUNCEMENT_CHANNEL_ID || '',
  BOMB_CHANNEL_ID: process.env.BOMB_CHANNEL_ID || '',
  ADMIN_ROLE_ID: process.env.ADMIN_ROLE_ID || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const;
