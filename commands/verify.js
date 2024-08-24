const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs').promises;

const VERIFIED_USERS_FILE = './verified_users.json';
const VERIFY_SETTINGS_FILE = './verify_settings.json';

async function ensureFilesExist() {
    for (const file of [VERIFIED_USERS_FILE, VERIFY_SETTINGS_FILE]) {
        try {
            await fs.access(file);
        } catch {
            await fs.writeFile(file, JSON.stringify([]));
        }
    }
}

async function readJsonFile(filePath) {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

async function writeJsonFile(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function saveVerifySettings(messageId, roleId, channelId, guildId) {
    const verifySettings = await readJsonFile(VERIFY_SETTINGS_FILE);
    verifySettings.push({ message_id: messageId, role_id: roleId, channel_id: channelId, guild_id: guildId });
    await writeJsonFile(VERIFY_SETTINGS_FILE, verifySettings);
}

module.exports = {
    name: 'verify',
    description: '認証メッセージを設定します',
    options: [
        {
            name: 'role',
            type: 8,
            description: '付与するロール',
            required: true
        },
        {
            name: 'title',
            type: 3,
            description: '埋め込みタイトル',
            required: true
        },
        {
            name: 'description',
            type: 3,
            description: '埋め込み説明',
            required: true
        },
        {
            name: 'button',
            type: 3,
            description: 'ボタンラベル',
            required: true
        },
        {
            name: 'image',
            type: 11,
            description: '画像ファイル',
            required: false
        }
    ],
    async execute(interaction) {
        await ensureFilesExist();

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return await interaction.reply({ content: 'このコマンドを使用する権限がありません。', ephemeral: true });
        }

        const role = interaction.options.getRole('role');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const buttonLabel = interaction.options.getString('button');
        const image = interaction.options.getAttachment('image');

        const verifyEmbed = new EmbedBuilder()
            .setColor(0x7fff7f)
            .setTitle(title)
            .setDescription(description);

        if (image && image.contentType.startsWith('image/')) {
            verifyEmbed.setImage(image.url);
        }

        const button = new ButtonBuilder()
            .setCustomId('verify')
            .setLabel(buttonLabel)
            .setStyle(ButtonStyle.Success);

        const row = new ActionRowBuilder().addComponents(button);

        const message = await interaction.reply({ embeds: [verifyEmbed], components: [row], fetchReply: true });

        await saveVerifySettings(message.id, role.id, interaction.channel.id, interaction.guild.id);

        const collector = message.createMessageComponentCollector({ filter: i => i.customId === 'verify' });

        collector.on('collect', async (i) => {
            try {
                if (i.member.roles.cache.has(role.id)) {
                    const alreadyVerifiedEmbed = new EmbedBuilder()
                         .setColor(0x7fff7f)
                         .setTitle('既に認証済み')
                         .setDescription('あなたは既に認証済みです。')
                         .setTimestamp();
                    await i.reply({ embeds: [alreadyVerifiedEmbed], ephemeral: true });
                    return;
                }

                await i.member.roles.add(role);
                const verificationSuccessEmbed = new EmbedBuilder()
                     .setColor(0x7fff7f)
                    .setDescription('認証が完了しました。')
                    .addFields({ name: '付与されたロール', value: role.name })
                    .setTimestamp();
                await i.reply({ embeds: [verificationSuccessEmbed], ephemeral: true });
            } catch (error) {
                console.error('認証エラー:', error);
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff4d4d)
                    .setTitle('エラー')
                    .setDescription('認証処理中にエラーが発生しました。')
                    .setTimestamp();
                await i.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        });
    },
};