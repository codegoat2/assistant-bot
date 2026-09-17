import 'dotenv/config';
import { Events, Interaction, ChatInputCommandInteraction } from 'discord.js';
import { createAssistantClient, getAssistantClient } from './client';
import { config } from './config/env';
import { logger } from './utils/logger';
import { handleStartGiveaway, handleEndGiveaway, handleListGiveaways } from './commands/giveaway';
import { handleAnnounce, handleEmbed, handleBroadcast } from './commands/embed';
import { handleBomb, handleToggleBomb } from './commands/nuke';
import { handleFees, handleFeesInteraction, handleFeesModal } from './commands/fees';
import { handlePostFeeEmbed } from './commands/postFeeEmbed';
import { handleSetlog } from './commands/setlog';
import { startNukeService } from './services/nukeService';
import { startGiveawayCleanupWorker } from './services/giveawayService';
import { registerLogEvents } from './services/logEvents';

async function main(): Promise<void> {
  logger.info('RapidEx Assistant Bot starting...');

  const client = createAssistantClient();

  client.on(Events.ClientReady, async (c) => {
    logger.info(`Assistant logged in as ${c.user.username}`);

    try {
      const { registerCommands } = await import('./register');
      await registerCommands();
    } catch (err) {
      logger.error(`Failed to register commands: ${String(err)}`);
    }

    registerLogEvents(client);
    startNukeService();
    startGiveawayCleanupWorker();
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    // Handle button interactions
    if (interaction.isButton()) {
      if (interaction.customId === 'fee_calc_start') {
        // Start the fee calculation flow (same as /fees command)
        await handleFees(interaction);
      }
      return;
    }

    // Handle string select menu interactions (dropdowns)
    if (interaction.isStringSelectMenu()) {
      await handleFeesInteraction(interaction);
      return;
    }

    // Handle modal submissions
    if (interaction.isModalSubmit()) {
      await handleFeesModal(interaction);
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const cmd = interaction as ChatInputCommandInteraction;

    try {
      switch (cmd.commandName) {
        case 'giveaway-start':  await handleStartGiveaway(cmd); break;
        case 'giveaway-end':    await handleEndGiveaway(cmd); break;
        case 'giveaway-list':   await handleListGiveaways(cmd); break;
        case 'announce':        await handleAnnounce(cmd); break;
        case 'embed':           await handleEmbed(cmd); break;
        case 'broadcast':       await handleBroadcast(cmd); break;
        case 'bomb':            await handleBomb(cmd); break;
        case 'toggle-bomb':     await handleToggleBomb(cmd); break;
        case 'fees':            await handleFees(cmd); break;
        case 'postfeeembed':    await handlePostFeeEmbed(cmd); break;
        case 'setlog':          await handleSetlog(cmd); break;
        default:
          logger.warn(`Unknown assistant command: ${cmd.commandName}`);
          await cmd.reply({ content: '❌ Unknown command.', ephemeral: true });
      }
    } catch (err) {
      logger.error(`Assistant interaction error for ${cmd.commandName}: ${String(err)}`);
      const msg = '❌ An error occurred. Please try again.';
      try {
        if (cmd.replied || cmd.deferred) {
          await cmd.followUp({ content: msg, ephemeral: true });
        } else {
          await cmd.reply({ content: msg, ephemeral: true });
        }
      } catch { /* interaction timed out */ }
    }
  });

  client.on(Events.Error, (err) => {
    logger.error(`Assistant Discord client error: ${String(err)}`);
  });

  client.on(Events.Warn, (msg) => {
    logger.warn(`Assistant Discord client warning: ${msg}`);
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
