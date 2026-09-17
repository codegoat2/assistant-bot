import {
  Client,
  Events,
  EmbedBuilder,
  GuildMember,
  PartialGuildMember,
  Message,
  PartialMessage,
  Guild,
  Role,
  GuildChannel,
  GuildEmoji,
  Invite,
  VoiceState,
  GuildBan,
  ThreadChannel,
  Sticker,
  GuildAuditLogsEntry,
  AuditLogEvent,
  AuditLogOptionsType,
} from 'discord.js';
import { sendLog } from './logService';
import { COLORS } from '../embeds/colors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ts(): number {
  return Math.floor(Date.now() / 1000);
}

function makeEmbed(color: number, title: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(color as any)
    .setTitle(title)
    .setTimestamp();
}

function avatarUrl(member: GuildMember | PartialGuildMember): string {
  return member.user?.displayAvatarURL() ?? '';
}

// ---------------------------------------------------------------------------
// Register all log event listeners on the client
// ---------------------------------------------------------------------------

export function registerLogEvents(client: Client): void {

  // ── Member Join ───────────────────────────────────────────────────────────
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const embed = makeEmbed(COLORS.SUCCESS, '📥 Member Joined')
      .setThumbnail(avatarUrl(member))
      .setDescription(`${member} joined the server.`)
      .addFields(
        { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: 'Account Created', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: 'Member Count', value: String(member.guild.memberCount), inline: true },
      );
    await sendLog(embed);
  });

  // ── Member Leave ──────────────────────────────────────────────────────────
  client.on(Events.GuildMemberRemove, async (member: GuildMember | PartialGuildMember) => {
    const embed = makeEmbed(COLORS.ERROR, '📤 Member Left')
      .setThumbnail(avatarUrl(member))
      .setDescription(`${member.user?.tag ?? 'Unknown'} left the server.`)
      .addFields(
        { name: 'User', value: `${member.user?.tag ?? 'Unknown'} (${member.id})`, inline: true },
        { name: 'Joined At', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
      );
    await sendLog(embed);
  });

  // ── Member Update (roles, nickname, boost) ────────────────────────────────
  client.on(Events.GuildMemberUpdate, async (oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) => {
    const changes: string[] = [];

    // Boost status
    if (!oldMember.premiumSince && newMember.premiumSince) {
      changes.push(`🚀 Started boosting the server`);
    }
    if (oldMember.premiumSince && !newMember.premiumSince) {
      changes.push(`💔 Stopped boosting the server`);
    }

    // Nickname
    if (oldMember.nickname !== newMember.nickname) {
      changes.push(`📝 Nickname: \`${oldMember.nickname ?? 'None'}\` → \`${newMember.nickname ?? 'None'}\``);
    }

    // Roles
    const addedRoles = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));

    if (addedRoles.size > 0) {
      changes.push(`✅ Roles Added: ${addedRoles.map(r => `<@&${r.id}>`).join(', ')}`);
    }
    if (removedRoles.size > 0) {
      changes.push(`❌ Roles Removed: ${removedRoles.map(r => `<@&${r.id}>`).join(', ')}`);
    }

    if (changes.length === 0) return;

    const color = newMember.premiumSince && !oldMember.premiumSince ? 0xFF73FA : COLORS.WARNING;
    const title = newMember.premiumSince && !oldMember.premiumSince ? '🚀 Member Boosted' : '✏️ Member Updated';

    const embed = makeEmbed(color, title)
      .setThumbnail(avatarUrl(newMember))
      .setDescription(`${newMember} was updated.`)
      .addFields(
        { name: 'User', value: `${newMember.user.tag} (${newMember.id})`, inline: true },
        { name: 'Changes', value: changes.join('\n') },
      );
    await sendLog(embed);
  });

  // ── Message Deleted ───────────────────────────────────────────────────────
  client.on(Events.MessageDelete, async (message: Message | PartialMessage) => {
    if (message.author?.bot) return;
    if (!message.guild) return;

    const embed = makeEmbed(COLORS.ERROR, '🗑️ Message Deleted')
      .addFields(
        { name: 'Author', value: message.author ? `${message.author.tag} (${message.author.id})` : 'Unknown', inline: true },
        { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
        { name: 'Content', value: message.content ? (message.content.length > 1000 ? message.content.slice(0, 1000) + '…' : message.content) : '*No text content*' },
      );

    if (message.attachments.size > 0) {
      embed.addFields({ name: 'Attachments', value: message.attachments.map(a => a.url).join('\n') });
    }

    await sendLog(embed);
  });

  // ── Bulk Message Delete ───────────────────────────────────────────────────
  client.on(Events.MessageBulkDelete, async (messages, channel) => {
    const embed = makeEmbed(COLORS.ERROR, '🗑️ Bulk Messages Deleted')
      .addFields(
        { name: 'Channel', value: `<#${channel.id}>`, inline: true },
        { name: 'Count', value: String(messages.size), inline: true },
      );
    await sendLog(embed);
  });

  // ── Message Edited ────────────────────────────────────────────────────────
  client.on(Events.MessageUpdate, async (oldMsg: Message | PartialMessage, newMsg: Message | PartialMessage) => {
    if (newMsg.author?.bot) return;
    if (!newMsg.guild) return;
    if (oldMsg.content === newMsg.content) return;

    const embed = makeEmbed(COLORS.WARNING, '✏️ Message Edited')
      .addFields(
        { name: 'Author', value: newMsg.author ? `${newMsg.author.tag} (${newMsg.author.id})` : 'Unknown', inline: true },
        { name: 'Channel', value: `<#${newMsg.channelId}>`, inline: true },
        { name: 'Jump to Message', value: newMsg.url, inline: true },
        { name: 'Before', value: oldMsg.content ? (oldMsg.content.length > 500 ? oldMsg.content.slice(0, 500) + '…' : oldMsg.content) : '*No text content*' },
        { name: 'After', value: newMsg.content ? (newMsg.content.length > 500 ? newMsg.content.slice(0, 500) + '…' : newMsg.content) : '*No text content*' },
      );
    await sendLog(embed);
  });

  // ── Guild (Server) Updated ────────────────────────────────────────────────
  client.on(Events.GuildUpdate, async (oldGuild: Guild, newGuild: Guild) => {
    const changes: string[] = [];

    if (oldGuild.name !== newGuild.name)
      changes.push(`📛 Name: \`${oldGuild.name}\` → \`${newGuild.name}\``);
    if (oldGuild.description !== newGuild.description)
      changes.push(`📄 Description changed`);
    if (oldGuild.icon !== newGuild.icon)
      changes.push(`🖼️ Icon changed`);
    if (oldGuild.banner !== newGuild.banner)
      changes.push(`🖼️ Banner changed`);
    if (oldGuild.verificationLevel !== newGuild.verificationLevel)
      changes.push(`🔒 Verification Level: \`${oldGuild.verificationLevel}\` → \`${newGuild.verificationLevel}\``);
    if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter)
      changes.push(`🔞 Content Filter changed`);
    if (oldGuild.defaultMessageNotifications !== newGuild.defaultMessageNotifications)
      changes.push(`🔔 Notification settings changed`);
    if (oldGuild.vanityURLCode !== newGuild.vanityURLCode)
      changes.push(`🔗 Vanity URL: \`${oldGuild.vanityURLCode ?? 'None'}\` → \`${newGuild.vanityURLCode ?? 'None'}\``);

    if (changes.length === 0) return;

    const embed = makeEmbed(COLORS.INFO, '⚙️ Server Updated')
      .setThumbnail(newGuild.iconURL() ?? null)
      .addFields({ name: 'Changes', value: changes.join('\n') });
    await sendLog(embed);
  });

  // ── Role Created ──────────────────────────────────────────────────────────
  client.on(Events.GuildRoleCreate, async (role: Role) => {
    const embed = makeEmbed(role.color || COLORS.SUCCESS, '🎭 Role Created')
      .addFields(
        { name: 'Role', value: `<@&${role.id}> (${role.name})`, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
        { name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
        { name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
      );
    await sendLog(embed);
  });

  // ── Role Deleted ──────────────────────────────────────────────────────────
  client.on(Events.GuildRoleDelete, async (role: Role) => {
    const embed = makeEmbed(COLORS.ERROR, '🎭 Role Deleted')
      .addFields(
        { name: 'Role', value: role.name, inline: true },
        { name: 'Color', value: role.hexColor, inline: true },
      );
    await sendLog(embed);
  });

  // ── Role Updated ──────────────────────────────────────────────────────────
  client.on(Events.GuildRoleUpdate, async (oldRole: Role, newRole: Role) => {
    const changes: string[] = [];

    if (oldRole.name !== newRole.name)
      changes.push(`📛 Name: \`${oldRole.name}\` → \`${newRole.name}\``);
    if (oldRole.color !== newRole.color)
      changes.push(`🎨 Color: \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``);
    if (oldRole.hoist !== newRole.hoist)
      changes.push(`📌 Hoisted: \`${oldRole.hoist}\` → \`${newRole.hoist}\``);
    if (oldRole.mentionable !== newRole.mentionable)
      changes.push(`🔔 Mentionable: \`${oldRole.mentionable}\` → \`${newRole.mentionable}\``);
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield)
      changes.push(`🔑 Permissions changed`);

    if (changes.length === 0) return;

    const embed = makeEmbed(COLORS.WARNING, '🎭 Role Updated')
      .addFields(
        { name: 'Role', value: `<@&${newRole.id}>`, inline: true },
        { name: 'Changes', value: changes.join('\n') },
      );
    await sendLog(embed);
  });

  // ── Channel Created ───────────────────────────────────────────────────────
  client.on(Events.ChannelCreate, async (channel: GuildChannel) => {
    const embed = makeEmbed(COLORS.SUCCESS, '📢 Channel Created')
      .addFields(
        { name: 'Channel', value: `<#${channel.id}> (${channel.name})`, inline: true },
        { name: 'Type', value: String(channel.type), inline: true },
        { name: 'Category', value: channel.parent?.name ?? 'None', inline: true },
      );
    await sendLog(embed);
  });

  // ── Channel Deleted ───────────────────────────────────────────────────────
  client.on(Events.ChannelDelete, async (channel) => {
    if (!('guild' in channel)) return;
    const embed = makeEmbed(COLORS.ERROR, '📢 Channel Deleted')
      .addFields(
        { name: 'Channel', value: channel.name ?? 'Unknown', inline: true },
        { name: 'Type', value: String(channel.type), inline: true },
        { name: 'Category', value: ('parent' in channel ? channel.parent?.name : null) ?? 'None', inline: true },
      );
    await sendLog(embed);
  });

  // ── Channel Updated ───────────────────────────────────────────────────────
  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    if (!('guild' in newChannel)) return;

    const changes: string[] = [];
    const o = oldChannel as GuildChannel;
    const n = newChannel as GuildChannel;

    if (o.name !== n.name)
      changes.push(`📛 Name: \`${o.name}\` → \`${n.name}\``);
    if ('topic' in o && 'topic' in n && o.topic !== n.topic)
      changes.push(`📄 Topic: \`${(o as any).topic ?? 'None'}\` → \`${(n as any).topic ?? 'None'}\``);
    if ('nsfw' in o && 'nsfw' in n && o.nsfw !== n.nsfw)
      changes.push(`🔞 NSFW: \`${(o as any).nsfw}\` → \`${(n as any).nsfw}\``);
    if (o.parentId !== n.parentId)
      changes.push(`📁 Category changed`);

    if (changes.length === 0) return;

    const embed = makeEmbed(COLORS.WARNING, '📢 Channel Updated')
      .addFields(
        { name: 'Channel', value: `<#${n.id}>`, inline: true },
        { name: 'Changes', value: changes.join('\n') },
      );
    await sendLog(embed);
  });

  // ── Ban Added ─────────────────────────────────────────────────────────────
  client.on(Events.GuildBanAdd, async (ban: GuildBan) => {
    const embed = makeEmbed(COLORS.ERROR, '🔨 Member Banned')
      .setThumbnail(ban.user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
        { name: 'Reason', value: ban.reason ?? 'No reason provided', inline: true },
      );
    await sendLog(embed);
  });

  // ── Ban Removed ───────────────────────────────────────────────────────────
  client.on(Events.GuildBanRemove, async (ban: GuildBan) => {
    const embed = makeEmbed(COLORS.SUCCESS, '🔓 Member Unbanned')
      .setThumbnail(ban.user.displayAvatarURL())
      .addFields(
        { name: 'User', value: `${ban.user.tag} (${ban.user.id})`, inline: true },
      );
    await sendLog(embed);
  });

  // ── Voice State Update ────────────────────────────────────────────────────
  client.on(Events.VoiceStateUpdate, async (oldState: VoiceState, newState: VoiceState) => {
    const member = newState.member ?? oldState.member;
    if (!member) return;

    let title = '';
    let color: number = COLORS.INFO;
    const fields: { name: string; value: string; inline?: boolean }[] = [
      { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
    ];

    if (!oldState.channelId && newState.channelId) {
      title = '🔊 Joined Voice Channel';
      color = COLORS.SUCCESS;
      fields.push({ name: 'Channel', value: `<#${newState.channelId}>`, inline: true });
    } else if (oldState.channelId && !newState.channelId) {
      title = '🔇 Left Voice Channel';
      color = COLORS.ERROR;
      fields.push({ name: 'Channel', value: `<#${oldState.channelId}>`, inline: true });
    } else if (oldState.channelId !== newState.channelId) {
      title = '🔄 Moved Voice Channel';
      fields.push(
        { name: 'From', value: `<#${oldState.channelId}>`, inline: true },
        { name: 'To', value: `<#${newState.channelId}>`, inline: true },
      );
    } else if (!oldState.selfMute && newState.selfMute) {
      title = '🔇 Self-Muted';
    } else if (oldState.selfMute && !newState.selfMute) {
      title = '🎤 Self-Unmuted';
    } else if (!oldState.selfDeaf && newState.selfDeaf) {
      title = '🙉 Self-Deafened';
    } else if (oldState.selfDeaf && !newState.selfDeaf) {
      title = '👂 Self-Undeafened';
    } else if (!oldState.serverMute && newState.serverMute) {
      title = '🔇 Server-Muted';
      color = COLORS.WARNING;
    } else if (oldState.serverMute && !newState.serverMute) {
      title = '🎤 Server-Unmuted';
      color = COLORS.SUCCESS;
    } else if (!oldState.serverDeaf && newState.serverDeaf) {
      title = '🙉 Server-Deafened';
      color = COLORS.WARNING;
    } else if (oldState.serverDeaf && !newState.serverDeaf) {
      title = '👂 Server-Undeafened';
      color = COLORS.SUCCESS;
    } else if (!oldState.streaming && newState.streaming) {
      title = '📡 Started Streaming';
    } else if (oldState.streaming && !newState.streaming) {
      title = '📡 Stopped Streaming';
    } else {
      return; // no relevant change
    }

    const embed = makeEmbed(color, title).addFields(fields);
    await sendLog(embed);
  });

  // ── Invite Created ────────────────────────────────────────────────────────
  client.on(Events.InviteCreate, async (invite: Invite) => {
    const embed = makeEmbed(COLORS.INFO, '🔗 Invite Created')
      .addFields(
        { name: 'Code', value: invite.code, inline: true },
        { name: 'Channel', value: invite.channelId ? `<#${invite.channelId}>` : 'Unknown', inline: true },
        { name: 'Created By', value: invite.inviter ? `${invite.inviter.tag} (${invite.inviter.id})` : 'Unknown', inline: true },
        { name: 'Max Uses', value: invite.maxUses ? String(invite.maxUses) : 'Unlimited', inline: true },
        { name: 'Expires', value: invite.maxAge ? `<t:${Math.floor((Date.now() + invite.maxAge * 1000) / 1000)}:R>` : 'Never', inline: true },
      );
    await sendLog(embed);
  });

  // ── Invite Deleted ────────────────────────────────────────────────────────
  client.on(Events.InviteDelete, async (invite: Invite) => {
    const embed = makeEmbed(COLORS.ERROR, '🔗 Invite Deleted')
      .addFields(
        { name: 'Code', value: invite.code, inline: true },
        { name: 'Channel', value: invite.channelId ? `<#${invite.channelId}>` : 'Unknown', inline: true },
      );
    await sendLog(embed);
  });

  // ── Thread Created ────────────────────────────────────────────────────────
  client.on(Events.ThreadCreate, async (thread: ThreadChannel) => {
    const embed = makeEmbed(COLORS.SUCCESS, '🧵 Thread Created')
      .addFields(
        { name: 'Thread', value: `<#${thread.id}> (${thread.name})`, inline: true },
        { name: 'Parent Channel', value: thread.parentId ? `<#${thread.parentId}>` : 'Unknown', inline: true },
        { name: 'Owner', value: thread.ownerId ? `<@${thread.ownerId}>` : 'Unknown', inline: true },
      );
    await sendLog(embed);
  });

  // ── Thread Deleted ────────────────────────────────────────────────────────
  client.on(Events.ThreadDelete, async (thread: ThreadChannel) => {
    const embed = makeEmbed(COLORS.ERROR, '🧵 Thread Deleted')
      .addFields(
        { name: 'Thread', value: thread.name, inline: true },
        { name: 'Parent Channel', value: thread.parentId ? `<#${thread.parentId}>` : 'Unknown', inline: true },
      );
    await sendLog(embed);
  });

  // ── Thread Updated ────────────────────────────────────────────────────────
  client.on(Events.ThreadUpdate, async (oldThread: ThreadChannel, newThread: ThreadChannel) => {
    const changes: string[] = [];

    if (oldThread.name !== newThread.name)
      changes.push(`📛 Name: \`${oldThread.name}\` → \`${newThread.name}\``);
    if (oldThread.archived !== newThread.archived)
      changes.push(newThread.archived ? `📦 Archived` : `📂 Unarchived`);
    if (oldThread.locked !== newThread.locked)
      changes.push(newThread.locked ? `🔒 Locked` : `🔓 Unlocked`);

    if (changes.length === 0) return;

    const embed = makeEmbed(COLORS.WARNING, '🧵 Thread Updated')
      .addFields(
        { name: 'Thread', value: `<#${newThread.id}>`, inline: true },
        { name: 'Changes', value: changes.join('\n') },
      );
    await sendLog(embed);
  });

  // ── Emoji Created ─────────────────────────────────────────────────────────
  client.on(Events.GuildEmojiCreate, async (emoji: GuildEmoji) => {
    const embed = makeEmbed(COLORS.SUCCESS, '😀 Emoji Created')
      .setThumbnail(emoji.url)
      .addFields(
        { name: 'Name', value: emoji.name ?? 'Unknown', inline: true },
        { name: 'ID', value: emoji.id, inline: true },
        { name: 'Animated', value: emoji.animated ? 'Yes' : 'No', inline: true },
      );
    await sendLog(embed);
  });

  // ── Emoji Deleted ─────────────────────────────────────────────────────────
  client.on(Events.GuildEmojiDelete, async (emoji: GuildEmoji) => {
    const embed = makeEmbed(COLORS.ERROR, '😀 Emoji Deleted')
      .addFields(
        { name: 'Name', value: emoji.name ?? 'Unknown', inline: true },
        { name: 'ID', value: emoji.id, inline: true },
      );
    await sendLog(embed);
  });

  // ── Emoji Updated ─────────────────────────────────────────────────────────
  client.on(Events.GuildEmojiUpdate, async (oldEmoji: GuildEmoji, newEmoji: GuildEmoji) => {
    if (oldEmoji.name === newEmoji.name) return;
    const embed = makeEmbed(COLORS.WARNING, '😀 Emoji Renamed')
      .setThumbnail(newEmoji.url)
      .addFields(
        { name: 'Old Name', value: oldEmoji.name ?? 'Unknown', inline: true },
        { name: 'New Name', value: newEmoji.name ?? 'Unknown', inline: true },
      );
    await sendLog(embed);
  });

  // ── Sticker Created ───────────────────────────────────────────────────────
  client.on(Events.GuildStickerCreate, async (sticker: Sticker) => {
    const embed = makeEmbed(COLORS.SUCCESS, '🪄 Sticker Created')
      .addFields(
        { name: 'Name', value: sticker.name, inline: true },
        { name: 'ID', value: sticker.id, inline: true },
      );
    await sendLog(embed);
  });

  // ── Sticker Deleted ───────────────────────────────────────────────────────
  client.on(Events.GuildStickerDelete, async (sticker: Sticker) => {
    const embed = makeEmbed(COLORS.ERROR, '🪄 Sticker Deleted')
      .addFields(
        { name: 'Name', value: sticker.name, inline: true },
        { name: 'ID', value: sticker.id, inline: true },
      );
    await sendLog(embed);
  });

  // ── Sticker Updated ───────────────────────────────────────────────────────
  client.on(Events.GuildStickerUpdate, async (oldSticker: Sticker, newSticker: Sticker) => {
    if (oldSticker.name === newSticker.name) return;
    const embed = makeEmbed(COLORS.WARNING, '🪄 Sticker Renamed')
      .addFields(
        { name: 'Old Name', value: oldSticker.name, inline: true },
        { name: 'New Name', value: newSticker.name, inline: true },
      );
    await sendLog(embed);
  });

  // ── Scheduled Event Created ───────────────────────────────────────────────
  client.on(Events.GuildScheduledEventCreate, async (event) => {
    const embed = makeEmbed(COLORS.SUCCESS, '📅 Scheduled Event Created')
      .addFields(
        { name: 'Name', value: event.name, inline: true },
        { name: 'Starts', value: event.scheduledStartAt ? `<t:${Math.floor(event.scheduledStartAt.getTime() / 1000)}:F>` : 'Unknown', inline: true },
        { name: 'Created By', value: event.creatorId ? `<@${event.creatorId}>` : 'Unknown', inline: true },
      );
    await sendLog(embed);
  });

  // ── Scheduled Event Deleted ───────────────────────────────────────────────
  client.on(Events.GuildScheduledEventDelete, async (event) => {
    const embed = makeEmbed(COLORS.ERROR, '📅 Scheduled Event Deleted')
      .addFields({ name: 'Name', value: event.name ?? 'Unknown', inline: true });
    await sendLog(embed);
  });

  // ── Scheduled Event Updated ───────────────────────────────────────────────
  client.on(Events.GuildScheduledEventUpdate, async (oldEvent, newEvent) => {
    if (!newEvent) return;
    const changes: string[] = [];

    if (oldEvent?.name !== newEvent.name)
      changes.push(`📛 Name: \`${oldEvent?.name}\` → \`${newEvent.name}\``);
    if (oldEvent?.status !== newEvent.status)
      changes.push(`📊 Status: \`${oldEvent?.status}\` → \`${newEvent.status}\``);

    if (changes.length === 0) return;

    const embed = makeEmbed(COLORS.WARNING, '📅 Scheduled Event Updated')
      .addFields(
        { name: 'Event', value: newEvent.name, inline: true },
        { name: 'Changes', value: changes.join('\n') },
      );
    await sendLog(embed);
  });
}
