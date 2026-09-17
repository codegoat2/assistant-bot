import 'dotenv/config';
import { Events, Interaction, ChatInputCommandInteraction, ButtonInteraction } from 'discord.js';
import { createAssistantClient, getAssistantClient } from './client';
import { config } from './config/env';
import { logger } from './utils/logger';

// ── Commands ──────────────────────────────────────────────────────────────
import { handleStartGiveaway, handleEndGiveaway, handleListGiveaways } from './commands/giveaway';
import { handleAnnounce, handleEmbed, handleBroadcast } from './commands/embed';
import { handleBomb, handleToggleBomb } from './commands/nuke';
import { handleFees, handleFeesInteraction, handleFeesModal } from './commands/fees';
import { handlePostFeeEmbed } from './commands/postFeeEmbed';
import { handleSetlog } from './commands/setlog';
import { handleSetupServer } from './commands/serverSetup';
import { handleServerInfo } from './commands/serverInfo';

// ── Services ──────────────────────────────────────────────────────────────
import { startNukeService } from './services/nukeService';
import { startGiveawayCleanupWorker } from './services/giveawayService';
import { registerLogEvents } from './services/logEvents';
import {
  handleTicketModal,
  handleTicketClose,
  handleTicketClaim,
  mmRequestModal,
  supportRequestModal,
  exchangerApplicationModal,
  staffApplicationModal,
} from './services/ticketService';

// ---------------------------------------------------------------------------
// Ticket button → modal launcher
// ---------------------------------------------------------------------------

async function handleTicketButton(interaction: ButtonInteraction): Promise<void> {
  const { customId } = interaction;

  switch (customId) {
    case 'open_ticket_mm':
      await interaction.showModal(mmRequestModal() as any);
      break;

    case 'open_ticket_support':
      await interaction.showModal(supportRequestModal() as any);
      break;

    case 'open_ticket_apply_exchanger':
      await interaction.showModal(exchangerApplicationModal() as any);
      break;

    case 'open_ticket_apply_staff':
      await interaction.showModal(staffApplicationModal() as any);
      break;

    case 'ticket_close':
      await handleTicketClose(interaction);
      break;

    case 'ticket_claim':
      await handleTicketClaim(interaction);
      break;

    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

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
    // ── Button interactions ────────────────────────────────────────────────
    if (interaction.isButton()) {
      const btn = interaction as ButtonInteraction;

      // Fee calculator button (existing)
      if (btn.customId === 'fee_calc_start') {
        await handleFees(btn);
        return;
      }

      // Ticket buttons (new)
      if (
        btn.customId.startsWith('open_ticket_') ||
        btn.customId === 'ticket_close' ||
        btn.customId === 'ticket_claim'
      ) {
        await handleTicketButton(btn);
        return;
      }

      return;
    }

    // ── Select menu interactions ───────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      await handleFeesInteraction(interaction);
      return;
    }

    // ── Modal submissions ──────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      const modal = interaction;

      // Fee modal (existing)
      if (modal.customId.startsWith('fees_amount_modal_')) {
        await handleFeesModal(modal);
        return;
      }

      // Ticket modals (new)
      if (
        modal.customId === 'modal_mm_request' ||
        modal.customId === 'modal_support_request' ||
        modal.customId === 'modal_apply_exchanger' ||
        modal.customId === 'modal_apply_staff'
      ) {
        await handleTicketModal(modal);
        return;
      }

      return;
    }

    // ── Slash commands ─────────────────────────────────────────────────────
    if (!interaction.isChatInputCommand()) return;

    const cmd = interaction as ChatInputCommandInteraction;

    try {
      switch (cmd.commandName) {
        case 'giveaway-start':  await handleStartGiveaway(cmd);  break;
        case 'giveaway-end':    await handleEndGiveaway(cmd);    break;
        case 'giveaway-list':   await handleListGiveaways(cmd);  break;
        case 'announce':        await handleAnnounce(cmd);       break;
        case 'embed':           await handleEmbed(cmd);          break;
        case 'broadcast':       await handleBroadcast(cmd);      break;
        case 'bomb':            await handleBomb(cmd);           break;
        case 'toggle-bomb':     await handleToggleBomb(cmd);     break;
        case 'fees':            await handleFees(cmd);           break;
        case 'postfeeembed':    await handlePostFeeEmbed(cmd);   break;
        case 'setlog':          await handleSetlog(cmd);         break;
        case 'setup-server':    await handleSetupServer(cmd);    break;
        case 'server-info':     await handleServerInfo(cmd);     break;
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
