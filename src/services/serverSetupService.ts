import {
  Guild,
  PermissionFlagsBits,
  ChannelType,
  CategoryChannel,
  Role,
  OverwriteResolvable,
  TextChannel,
  VoiceChannel,
  EmbedBuilder,
} from 'discord.js';
import { COLORS } from '../embeds/colors';

// ---------------------------------------------------------------------------
// Role definitions
// ---------------------------------------------------------------------------

export interface RoleDefinition {
  name: string;
  color: number;
  hoist: boolean;          // show separately in member list
  mentionable: boolean;
  position: number;        // higher = closer to top
  permissions: bigint;
}

// Tier-based customer roles (by total volume traded)
const CUSTOMER_TIERS: RoleDefinition[] = [
  {
    name: '◆ Diamond Customer',
    color: 0xB9F2FF,
    hoist: true,
    mentionable: false,
    position: 8,
    permissions: PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.ViewChannel | PermissionFlagsBits.UseApplicationCommands,
  },
  {
    name: '◈ Platinum Customer',
    color: 0xE5E4E2,
    hoist: true,
    mentionable: false,
    position: 7,
    permissions: PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.ViewChannel | PermissionFlagsBits.UseApplicationCommands,
  },
  {
    name: '◉ Gold Customer',
    color: 0xFFD700,
    hoist: true,
    mentionable: false,
    position: 6,
    permissions: PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.ViewChannel | PermissionFlagsBits.UseApplicationCommands,
  },
  {
    name: '◎ Silver Customer',
    color: 0xC0C0C0,
    hoist: true,
    mentionable: false,
    position: 5,
    permissions: PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.ViewChannel | PermissionFlagsBits.UseApplicationCommands,
  },
  {
    name: '○ Bronze Customer',
    color: 0xCD7F32,
    hoist: true,
    mentionable: false,
    position: 4,
    permissions: PermissionFlagsBits.SendMessages | PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.ViewChannel | PermissionFlagsBits.UseApplicationCommands,
  },
];

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    name: '★ Admin',
    color: 0xFF4500,
    hoist: true,
    mentionable: true,
    position: 16,
    permissions: PermissionFlagsBits.Administrator,
  },
  {
    name: '✦ Staff',
    color: 0xFF6B00,
    hoist: true,
    mentionable: true,
    position: 15,
    permissions:
      PermissionFlagsBits.ManageMessages |
      PermissionFlagsBits.KickMembers |
      PermissionFlagsBits.BanMembers |
      PermissionFlagsBits.ManageNicknames |
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.ModerateMembers,
  },
  {
    name: '◇ Trial Staff',
    color: 0xFFB347,
    hoist: true,
    mentionable: true,
    position: 14,
    permissions:
      PermissionFlagsBits.ManageMessages |
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory,
  },
  {
    name: '◈ Exchanger',
    color: 0x00CFFF,
    hoist: true,
    mentionable: true,
    position: 13,
    permissions:
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.UseApplicationCommands |
      PermissionFlagsBits.AttachFiles |
      PermissionFlagsBits.EmbedLinks,
  },
  {
    name: '◑ PayPal Exchanger',
    color: 0x009CDE,
    hoist: false,
    mentionable: true,
    position: 12,
    permissions:
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.UseApplicationCommands,
  },
  {
    name: '◐ Revolut Exchanger',
    color: 0x191C1E,
    hoist: false,
    mentionable: true,
    position: 11,
    permissions:
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.UseApplicationCommands,
  },
  {
    name: '◒ Bank Transfer Exchanger',
    color: 0x2B7A0B,
    hoist: false,
    mentionable: true,
    position: 10,
    permissions:
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.UseApplicationCommands,
  },
  {
    name: '◆ Middleman',
    color: 0xAA00FF,
    hoist: true,
    mentionable: true,
    position: 9,
    permissions:
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.ManageMessages |
      PermissionFlagsBits.UseApplicationCommands,
  },
  // Customer tiers 8–4
  ...CUSTOMER_TIERS,
  {
    name: '· Member',
    color: 0xAAAAAA,
    hoist: false,
    mentionable: false,
    position: 3,
    permissions:
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.UseApplicationCommands,
  },
  {
    name: '· Verified',
    color: 0x57F287,
    hoist: false,
    mentionable: false,
    position: 2,
    permissions:
      PermissionFlagsBits.ViewChannel |
      PermissionFlagsBits.SendMessages |
      PermissionFlagsBits.ReadMessageHistory |
      PermissionFlagsBits.UseApplicationCommands,
  },
  {
    name: '· Unverified',
    color: 0x555555,
    hoist: false,
    mentionable: false,
    position: 1,
    permissions: PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ReadMessageHistory,
  },
];

// ---------------------------------------------------------------------------
// Channel / Category structure
// ---------------------------------------------------------------------------

type PermOverwrite = {
  /** role name exactly as defined in ROLE_DEFINITIONS, or '@everyone' */
  role: string;
  allow?: bigint;
  deny?: bigint;
};

interface ChannelDef {
  name: string;
  type: ChannelType.GuildText | ChannelType.GuildVoice | ChannelType.GuildAnnouncement | ChannelType.GuildForum;
  topic?: string;
  readonly?: boolean;   // shorthand: allow read, deny write for @everyone
  overwrites?: PermOverwrite[];
}

interface CategoryDef {
  name: string;
  overwrites?: PermOverwrite[];
  channels: ChannelDef[];
}

const VIEW_READ: bigint = PermissionFlagsBits.ViewChannel | PermissionFlagsBits.ReadMessageHistory;
const SEND: bigint = PermissionFlagsBits.SendMessages;
const FULL: bigint = VIEW_READ | SEND | PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.AttachFiles | PermissionFlagsBits.EmbedLinks;
const NONE: bigint = PermissionFlagsBits.ViewChannel;

export const SERVER_STRUCTURE: CategoryDef[] = [
  // ── § INFORMATION ─────────────────────────────────────────────────────────
  {
    name: '§ Information',
    overwrites: [
      { role: '@everyone', allow: VIEW_READ, deny: SEND },
    ],
    channels: [
      {
        name: '» announcements',
        type: ChannelType.GuildAnnouncement,
        topic: 'Official RapidEx announcements — follow this channel to get updates.',
        overwrites: [
          { role: '@everyone', allow: VIEW_READ, deny: SEND },
          { role: '★ Admin', allow: VIEW_READ | SEND },
          { role: '✦ Staff', allow: VIEW_READ | SEND },
        ],
      },
      {
        name: '» terms-of-service',
        type: ChannelType.GuildText,
        topic: 'RapidEx terms of service and usage rules.',
        overwrites: [
          { role: '@everyone', allow: VIEW_READ, deny: SEND },
        ],
      },
      {
        name: '» fees-and-rates',
        type: ChannelType.GuildText,
        topic: 'Up-to-date fee schedule for all exchange methods.',
        overwrites: [
          { role: '@everyone', allow: VIEW_READ, deny: SEND },
        ],
      },
      {
        name: '» backup-info',
        type: ChannelType.GuildText,
        topic: 'Backup contact links and alternative channels.',
        overwrites: [
          { role: '@everyone', allow: VIEW_READ, deny: SEND },
        ],
      },
    ],
  },

  // ── § SERVICES ────────────────────────────────────────────────────────────
  {
    name: '§ Services',
    overwrites: [
      { role: '@everyone', deny: NONE },
      { role: '· Verified', allow: VIEW_READ },
      { role: '· Member', allow: VIEW_READ },
    ],
    channels: [
      {
        name: '» exchange-tickets',
        type: ChannelType.GuildText,
        topic: 'Open a ticket to start an exchange with a verified exchanger.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Verified', allow: FULL },
          { role: '· Member', allow: FULL },
          { role: '◈ Exchanger', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» trade-history',
        type: ChannelType.GuildText,
        topic: 'Public log of completed trades.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Verified', allow: VIEW_READ },
          { role: '· Member', allow: VIEW_READ },
          { role: '◈ Exchanger', allow: VIEW_READ | SEND },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» middleman-services',
        type: ChannelType.GuildText,
        topic: 'Request a middleman for high-value trades.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Verified', allow: FULL },
          { role: '· Member', allow: FULL },
          { role: '◆ Middleman', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» support',
        type: ChannelType.GuildText,
        topic: 'General support — ask questions, report issues.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Unverified', allow: FULL },
          { role: '· Verified', allow: FULL },
          { role: '· Member', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
    ],
  },

  // ── § PUBLIC ──────────────────────────────────────────────────────────────
  {
    name: '§ Public',
    channels: [
      {
        name: '» general-chat',
        type: ChannelType.GuildText,
        topic: 'General discussion for all members.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Unverified', allow: VIEW_READ, deny: SEND },
          { role: '· Verified', allow: FULL },
          { role: '· Member', allow: FULL },
          { role: '◈ Exchanger', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» bot-commands',
        type: ChannelType.GuildText,
        topic: 'Use bot commands here.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Verified', allow: FULL },
          { role: '· Member', allow: FULL },
          { role: '◈ Exchanger', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» suggestions',
        type: ChannelType.GuildText,
        topic: 'Submit suggestions to improve RapidEx.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Verified', allow: FULL },
          { role: '· Member', allow: FULL },
          { role: '◈ Exchanger', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
    ],
  },

  // ── § CUSTOMER LOUNGE ─────────────────────────────────────────────────────
  {
    name: '§ Customer Lounge',
    overwrites: [
      { role: '@everyone', deny: NONE },
    ],
    channels: [
      {
        name: '» vip-lounge',
        type: ChannelType.GuildText,
        topic: 'Exclusive chat for Diamond & Platinum customers.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◆ Diamond Customer', allow: FULL },
          { role: '◈ Platinum Customer', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» gold-lounge',
        type: ChannelType.GuildText,
        topic: 'Chat for Gold-tier customers and above.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◉ Gold Customer', allow: FULL },
          { role: '◆ Diamond Customer', allow: FULL },
          { role: '◈ Platinum Customer', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» reviews',
        type: ChannelType.GuildText,
        topic: 'Leave a review after your trade.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◎ Silver Customer', allow: FULL },
          { role: '◉ Gold Customer', allow: FULL },
          { role: '◆ Diamond Customer', allow: FULL },
          { role: '◈ Platinum Customer', allow: FULL },
          { role: '○ Bronze Customer', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
    ],
  },

  // ── § APPLICATIONS ────────────────────────────────────────────────────────
  {
    name: '§ Exchanger Applications',
    overwrites: [
      { role: '@everyone', deny: NONE },
    ],
    channels: [
      {
        name: '» apply-exchanger',
        type: ChannelType.GuildText,
        topic: 'Read the requirements and apply to become a verified exchanger.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Verified', allow: FULL },
          { role: '· Member', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» exchanger-requirements',
        type: ChannelType.GuildText,
        topic: 'Read before applying.',
        overwrites: [
          { role: '@everyone', allow: VIEW_READ, deny: SEND },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
    ],
  },
  {
    name: '§ Staff Applications',
    overwrites: [
      { role: '@everyone', deny: NONE },
    ],
    channels: [
      {
        name: '» apply-staff',
        type: ChannelType.GuildText,
        topic: 'Submit your staff application here.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Verified', allow: FULL },
          { role: '· Member', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» staff-requirements',
        type: ChannelType.GuildText,
        topic: 'Requirements for staff — read before applying.',
        overwrites: [
          { role: '@everyone', allow: VIEW_READ, deny: SEND },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
    ],
  },

  // ── § SUPPORT (ticket threads live here) ─────────────────────────────────
  {
    name: '§ Support Center',
    overwrites: [
      { role: '@everyone', deny: NONE },
      { role: '✦ Staff', allow: FULL },
      { role: '◇ Trial Staff', allow: FULL },
      { role: '★ Admin', allow: FULL },
    ],
    channels: [
      {
        name: '» open-ticket',
        type: ChannelType.GuildText,
        topic: 'Click the button below to open a support ticket.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '· Unverified', allow: VIEW_READ },
          { role: '· Verified', allow: VIEW_READ | SEND },
          { role: '· Member', allow: VIEW_READ | SEND },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» ticket-transcripts',
        type: ChannelType.GuildText,
        topic: 'Closed ticket logs.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '✦ Staff', allow: FULL },
          { role: '◇ Trial Staff', allow: VIEW_READ },
          { role: '★ Admin', allow: FULL },
        ],
      },
    ],
  },

  // ── § EXCHANGER ZONE ──────────────────────────────────────────────────────
  {
    name: '§ Exchanger Zone',
    overwrites: [
      { role: '@everyone', deny: NONE },
      { role: '◈ Exchanger', allow: VIEW_READ },
      { role: '◑ PayPal Exchanger', allow: VIEW_READ },
      { role: '◐ Revolut Exchanger', allow: VIEW_READ },
      { role: '◒ Bank Transfer Exchanger', allow: VIEW_READ },
    ],
    channels: [
      {
        name: '» claim-exchange',
        type: ChannelType.GuildText,
        topic: 'Claim incoming exchange requests here.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◈ Exchanger', allow: FULL },
          { role: '◑ PayPal Exchanger', allow: FULL },
          { role: '◐ Revolut Exchanger', allow: FULL },
          { role: '◒ Bank Transfer Exchanger', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» exchanger-guide',
        type: ChannelType.GuildText,
        topic: 'How-to guide for processing exchanges.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◈ Exchanger', allow: VIEW_READ },
          { role: '◑ PayPal Exchanger', allow: VIEW_READ },
          { role: '◐ Revolut Exchanger', allow: VIEW_READ },
          { role: '◒ Bank Transfer Exchanger', allow: VIEW_READ },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» exchanger-chat',
        type: ChannelType.GuildText,
        topic: 'Private chat for verified exchangers.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◈ Exchanger', allow: FULL },
          { role: '◑ PayPal Exchanger', allow: FULL },
          { role: '◐ Revolut Exchanger', allow: FULL },
          { role: '◒ Bank Transfer Exchanger', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» exchanger-voice',
        type: ChannelType.GuildVoice,
        topic: 'Private voice channel for exchangers.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◈ Exchanger', allow: VIEW_READ | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak },
          { role: '◑ PayPal Exchanger', allow: VIEW_READ | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak },
          { role: '◐ Revolut Exchanger', allow: VIEW_READ | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak },
          { role: '◒ Bank Transfer Exchanger', allow: VIEW_READ | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak },
          { role: '✦ Staff', allow: VIEW_READ | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak | PermissionFlagsBits.MoveMembers },
          { role: '★ Admin', allow: VIEW_READ | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak | PermissionFlagsBits.MoveMembers },
        ],
      },
    ],
  },

  // ── § OPENED EXCHANGES ────────────────────────────────────────────────────
  {
    name: '§ Opened Exchanges',
    overwrites: [
      { role: '@everyone', deny: NONE },
      { role: '◈ Exchanger', allow: VIEW_READ },
      { role: '✦ Staff', allow: FULL },
      { role: '★ Admin', allow: FULL },
    ],
    channels: [
      {
        name: '» active-exchanges',
        type: ChannelType.GuildText,
        topic: 'Currently active exchange threads.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◈ Exchanger', allow: FULL },
          { role: '◑ PayPal Exchanger', allow: FULL },
          { role: '◐ Revolut Exchanger', allow: FULL },
          { role: '◒ Bank Transfer Exchanger', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» completed-exchanges',
        type: ChannelType.GuildText,
        topic: 'Archive of completed exchanges.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◈ Exchanger', allow: VIEW_READ },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
    ],
  },

  // ── § STAFF ───────────────────────────────────────────────────────────────
  {
    name: '§ Staff',
    overwrites: [
      { role: '@everyone', deny: NONE },
      { role: '✦ Staff', allow: FULL },
      { role: '◇ Trial Staff', allow: FULL },
      { role: '★ Admin', allow: FULL },
    ],
    channels: [
      {
        name: '» staff-chat',
        type: ChannelType.GuildText,
        topic: 'Internal staff communication.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◇ Trial Staff', allow: FULL },
          { role: '✦ Staff', allow: FULL },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» staff-announcements',
        type: ChannelType.GuildText,
        topic: 'Staff-only announcements from management.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◇ Trial Staff', allow: VIEW_READ },
          { role: '✦ Staff', allow: VIEW_READ },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» moderation-log',
        type: ChannelType.GuildText,
        topic: 'Auto-logged moderation actions.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '✦ Staff', allow: VIEW_READ },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» staff-voice',
        type: ChannelType.GuildVoice,
        topic: 'Staff voice channel.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '◇ Trial Staff', allow: VIEW_READ | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak },
          { role: '✦ Staff', allow: VIEW_READ | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak },
          { role: '★ Admin', allow: VIEW_READ | PermissionFlagsBits.Connect | PermissionFlagsBits.Speak | PermissionFlagsBits.MoveMembers },
        ],
      },
    ],
  },

  // ── § ADMIN ───────────────────────────────────────────────────────────────
  {
    name: '§ Admin',
    overwrites: [
      { role: '@everyone', deny: NONE },
      { role: '★ Admin', allow: FULL },
    ],
    channels: [
      {
        name: '» admin-chat',
        type: ChannelType.GuildText,
        topic: 'Admin-only coordination channel.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» admin-log',
        type: ChannelType.GuildText,
        topic: 'Bot and admin action audit log.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '★ Admin', allow: FULL },
        ],
      },
      {
        name: '» bot-config',
        type: ChannelType.GuildText,
        topic: 'Run bot configuration commands here.',
        overwrites: [
          { role: '@everyone', deny: NONE },
          { role: '★ Admin', allow: FULL },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Resolve a role name to a Discord Role object from the createdRoles map.
 */
function resolveOverwrites(
  overwrites: PermOverwrite[],
  createdRoles: Map<string, Role>,
  everyoneRole: Role,
): OverwriteResolvable[] {
  return overwrites
    .map((ow): OverwriteResolvable | null => {
      const role = ow.role === '@everyone' ? everyoneRole : createdRoles.get(ow.role);
      if (!role) return null;
      return {
        id: role.id,
        allow: ow.allow ?? BigInt(0),
        deny: ow.deny ?? BigInt(0),
      };
    })
    .filter((x): x is OverwriteResolvable => x !== null);
}

// ---------------------------------------------------------------------------
// Main setup function
// ---------------------------------------------------------------------------

export interface SetupProgress {
  onStep: (msg: string) => Promise<void>;
}

export async function runServerSetup(guild: Guild, progress: SetupProgress): Promise<void> {
  const { onStep } = progress;

  // ── 1. Delete all existing channels ──────────────────────────────────────
  await onStep('Deleting existing channels and categories...');
  const channels = await guild.channels.fetch();
  for (const [, ch] of channels) {
    if (!ch) continue;
    try {
      await ch.delete('Server setup — rebuilding structure');
      await sleep(300);
    } catch { /* skip undeletable (e.g. bot's own command channel) */ }
  }

  // ── 2. Delete all existing roles (except @everyone and bot role) ──────────
  await onStep('Deleting existing roles...');
  const roles = await guild.roles.fetch();
  const botMember = guild.members.me;
  const botRoleId = botMember?.roles.botRole?.id;

  for (const [, role] of roles) {
    if (!role) continue;
    if (role.id === guild.id) continue;           // @everyone
    if (role.id === botRoleId) continue;          // bot managed role
    if (role.managed) continue;                   // other managed roles
    try {
      await role.delete('Server setup — rebuilding roles');
      await sleep(300);
    } catch { /* skip protected roles */ }
  }

  // ── 3. Create roles ───────────────────────────────────────────────────────
  await onStep('Creating roles...');
  const createdRoles = new Map<string, Role>();

  // Sort by position descending so high-position roles are created first
  const sortedRoles = [...ROLE_DEFINITIONS].sort((a, b) => b.position - a.position);

  for (const def of sortedRoles) {
    try {
      const role = await guild.roles.create({
        name: def.name,
        color: def.color,
        hoist: def.hoist,
        mentionable: def.mentionable,
        permissions: def.permissions,
        reason: 'Server setup',
      });
      createdRoles.set(def.name, role);
      await sleep(350);
    } catch (err) {
      console.error(`[ServerSetup] Failed to create role "${def.name}":`, err);
    }
  }

  await onStep(`Created ${createdRoles.size} roles. Building channels...`);

  const everyoneRole = guild.roles.everyone;

  // ── 4. Create categories and channels ────────────────────────────────────
  let channelCount = 0;

  for (const catDef of SERVER_STRUCTURE) {
    // Build category permission overwrites
    const catOverwrites = catDef.overwrites
      ? resolveOverwrites(catDef.overwrites, createdRoles, everyoneRole)
      : [];

    let category: CategoryChannel;
    try {
      category = await guild.channels.create({
        name: catDef.name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: catOverwrites,
        reason: 'Server setup',
      }) as CategoryChannel;
      await sleep(400);
    } catch (err) {
      console.error(`[ServerSetup] Failed to create category "${catDef.name}":`, err);
      continue;
    }

    for (const chDef of catDef.channels) {
      const chOverwrites = chDef.overwrites
        ? resolveOverwrites(chDef.overwrites, createdRoles, everyoneRole)
        : [];

      try {
        await guild.channels.create({
          name: chDef.name,
          type: chDef.type,
          parent: category.id,
          topic: chDef.type !== ChannelType.GuildVoice ? chDef.topic : undefined,
          permissionOverwrites: chOverwrites,
          reason: 'Server setup',
        });
        channelCount++;
        await sleep(350);
      } catch (err) {
        console.error(`[ServerSetup] Failed to create channel "${chDef.name}":`, err);
      }
    }

    await onStep(`Built category: ${catDef.name}`);
  }

  await onStep(`Done! Created ${createdRoles.size} roles and ${channelCount} channels across ${SERVER_STRUCTURE.length} categories.`);
}

// ---------------------------------------------------------------------------
// Summary embed
// ---------------------------------------------------------------------------

export function setupSummaryEmbed(rolesCount: number, channelsCount: number, categoriesCount: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('★ Server Setup Complete')
    .setDescription('The server has been rebuilt from scratch with the RapidEx structure.')
    .addFields(
      { name: '§ Categories', value: String(categoriesCount), inline: true },
      { name: '» Channels', value: String(channelsCount), inline: true },
      { name: '◈ Roles', value: String(rolesCount), inline: true },
    )
    .setTimestamp()
    .setFooter({ text: 'RapidEx · Server Setup' });
}
