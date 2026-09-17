import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import { COLORS, BANNER_URL } from '../embeds/colors';
import { logger } from '../utils/logger';

export const serverInfoCommand = new SlashCommandBuilder()
  .setName('server-info')
  .setDescription('List all channel IDs and role IDs in this server')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function handleServerInfo(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: '❌ Must be used inside a server.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  await guild.channels.fetch();
  await guild.roles.fetch();

  // ── Build role list ───────────────────────────────────────────────────────
  const roles = [...guild.roles.cache.values()]
    .filter(r => r.id !== guild.id) // exclude @everyone
    .sort((a, b) => b.position - a.position);

  const roleLines = roles.map(r => `\`${r.id}\` · **${r.name}**`);

  // ── Build channel list grouped by category ────────────────────────────────
  const categories = [...guild.channels.cache.values()]
    .filter(c => c.type === ChannelType.GuildCategory)
    .sort((a, b) => ((a as any).position ?? 0) - ((b as any).position ?? 0));

  // Channels not in any category
  const uncategorised = [...guild.channels.cache.values()]
    .filter(
      c =>
        c.type !== ChannelType.GuildCategory &&
        !c.parentId,
    )
    .sort((a, b) => ((a as any).position ?? 0) - ((b as any).position ?? 0));

  const channelSections: string[] = [];

  if (uncategorised.length > 0) {
    channelSections.push(
      '**· No Category**\n' +
        uncategorised.map(c => `\`${c.id}\` · ${c.name}`).join('\n'),
    );
  }

  for (const cat of categories) {
    const children = [...guild.channels.cache.values()]
      .filter(c => c.parentId === cat.id)
      .sort((a, b) => ((a as any).position ?? 0) - ((b as any).position ?? 0));

    const lines = children.map(c => {
      const typeIcon =
        c.type === ChannelType.GuildVoice
          ? '🔊'
          : c.type === ChannelType.GuildAnnouncement
          ? '📢'
          : c.type === ChannelType.GuildForum
          ? '💬'
          : '·';
      return `\`${c.id}\` · ${typeIcon} ${c.name}`;
    });

    channelSections.push(
      `**§ ${cat.name}** \`${cat.id}\`\n` + (lines.length ? lines.join('\n') : '*(empty)*'),
    );
  }

  // ── Discord embed has a 6000 char limit total — split into pages if needed ─
  const roleText = roleLines.join('\n') || '*No roles*';
  const channelText = channelSections.join('\n\n') || '*No channels*';

  // Split channel text into chunks of ≤1000 chars per field
  function chunkText(text: string, maxLen = 1000): string[] {
    const chunks: string[] = [];
    const lines = text.split('\n');
    let current = '';
    for (const line of lines) {
      if (current.length + line.length + 1 > maxLen) {
        chunks.push(current);
        current = line;
      } else {
        current += (current ? '\n' : '') + line;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  }

  const roleChunks = chunkText(roleText);
  const channelChunks = chunkText(channelText);

  // ── Build embeds (one per page if overflowing) ────────────────────────────
  const embeds: EmbedBuilder[] = [];

  // Page 1 — roles + first channel chunk
  const page1 = new EmbedBuilder()
    .setColor(COLORS.PRIMARY as any)
    .setTitle(`★ Server Info — ${guild.name}`)
    .setDescription(`**Members:** ${guild.memberCount} · **Channels:** ${guild.channels.cache.size} · **Roles:** ${guild.roles.cache.size - 1}`)
    .setThumbnail(guild.iconURL({ size: 256 }) ?? null)
    .setFooter({ text: 'RapidEx · Server Info' })
    .setTimestamp();

  roleChunks.forEach((chunk, i) => {
    page1.addFields({
      name: i === 0 ? '◈ Roles' : '◈ Roles (cont.)',
      value: chunk,
    });
  });

  // First channel chunk on page 1 if it fits
  if (channelChunks.length > 0) {
    page1.addFields({ name: '» Channels', value: channelChunks[0] });
  }

  embeds.push(page1);

  // Remaining channel chunks on additional embeds
  for (let i = 1; i < channelChunks.length; i++) {
    const extra = new EmbedBuilder()
      .setColor(COLORS.PRIMARY as any)
      .setTitle(`» Channels (cont. ${i + 1})`)
      .addFields({ name: '\u200b', value: channelChunks[i] })
      .setFooter({ text: 'RapidEx · Server Info' });
    embeds.push(extra);
  }

  // Discord allows max 10 embeds per message
  const batch1 = embeds.slice(0, 10);
  const batch2 = embeds.slice(10);

  try {
    await interaction.editReply({ embeds: batch1 as any });
    if (batch2.length > 0) {
      await interaction.followUp({ embeds: batch2 as any, ephemeral: true });
    }
  } catch (err) {
    logger.error(`[ServerInfo] ${String(err)}`);
    await interaction.editReply({ content: `❌ Failed to build server info: ${String(err)}` });
  }
}
