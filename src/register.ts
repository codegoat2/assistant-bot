import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { config } from './config/env';
import { startGiveawayCommand, endGiveawayCommand, listGiveawaysCommand } from './commands/giveaway';
import { announceCommand, embedCommand, broadcastCommand } from './commands/embed';
import { bombCommand, toggleBombCommand } from './commands/nuke';
import { feesCommand } from './commands/fees';
import { postFeeEmbedCommand } from './commands/postFeeEmbed';
import { logger } from './utils/logger';

const commands = [
  startGiveawayCommand.toJSON(),
  endGiveawayCommand.toJSON(),
  listGiveawaysCommand.toJSON(),
  announceCommand.toJSON(),
  embedCommand.toJSON(),
  broadcastCommand.toJSON(),
  bombCommand.toJSON(),
  toggleBombCommand.toJSON(),
  feesCommand.toJSON(),
  postFeeEmbedCommand.toJSON(),
];

export async function registerCommands(): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(config.DISCORD_TOKEN);

  logger.info(`Registering ${commands.length} slash commands...`);

  await rest.put(
    Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, config.DISCORD_GUILD_ID),
    { body: commands },
  );

  logger.info('Slash commands registered successfully');
}

if (require.main === module) {
  registerCommands().catch((err) => {
    console.error('Failed to register commands:', err);
    process.exit(1);
  });
}
