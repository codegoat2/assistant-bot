import 'dotenv/config';
import { Events, Interaction } from 'discord.js';
import { createAssistantClient, getAssistantClient } from './client';
import { config } from './config/env';
import { logger } from './utils/logger';
import { handleStartGiveaway, handleEndGiveaway, handleListGiveaways } from './commands/giveaway';
import { handleAnnounce, handleEmbed, handleBroadcast } from './commands/embed';
import { handleBomb, handleToggleBomb } from './commands/nuke';
import { startNukeService, startGiveawayCleanupWorker } from './services/nukeService';
import { startGiveawayCleanupWorker as startGiveawayCleanup } from './services/giveawayService';

async function main(): Promise<void> {
  logger.info('RapidEx Assistant Bot starting...');

  const client = createAssistantClient();

  client.on(Events.ClientReady, async (c) => {
    logger.info(`Assistant logged in as ${c.user.username}`);

    if (config.NODE_ENV !== 'production') {
      const { registerCommands } = await import('./register');
      await registerCommands();
    }

    startNukeService();
    startGiveawayCleanup();
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        switch (interaction.commandName) {
          case 'giveaway-start':    await handleStartGiveaway(interaction); break;
          case 'giveaway-end':      await handleEndGiveaway(interaction); break;
          case 'giveaway-list':     await handleListGiveaways(interaction); break;
          case 'announce':          await handleAnnounce(interaction); break;
          case 'embed':             await handleEmbed(interaction); break;
          case 'broadcast':         await handleBroadcast(interaction); break;
          case 'bomb':              await handleBomb(interaction); break;
          case 'toggle-bomb':       await handleToggleBomb(interaction); break;
          default:
            logger.warn({ commandName: interaction.commandName }, 'Unknown assistant command');
            await interaction.reply({ content: '❌ Unknown command.', ephemeral: true });
        }
      }
    } catch (err) {
      logger.error({ err, commandName: (interaction as any).commandName }, 'Assistant interaction error');
      const msg = '❌ An error occurred. Please try again.';
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: msg, ephemeral: true });
        } else {
          await interaction.reply({ content: msg, ephemeral: true });
        }
      } catch { /* interaction timed out */ }
    }
  });

  client.on(Events.Error, (err) => {
    logger.error({ err }, 'Assistant Discord client error');
  });

  client.on(Events.Warn, (msg) => {
    logger.warn({ msg }, 'Assistant Discord client warning');
  });

  await client.login(config.DISCORD_TOKEN);
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  try { getAssistantClient().destroy(); } catch { /* already down */ }
  process.exit(0);
});
process.on('SIGINT', () => {
  try { getAssistantClient().destroy(); } catch { /* already down */ }
  process.exit(0);
});
