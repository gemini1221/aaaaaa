// gban.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config.json');

const GBAN_LIST_PATH = path.join(__dirname, '../gbanlist.json');

module.exports = {
    name: 'gban',
    description: 'グローバルBAN関連のコマンド',
    options: [
        {
            name: 'ban',
            type: 1,
            description: 'ユーザーをグローバルBANリストに追加します',
            options: [
                {
                    name: 'reason',
                    type: 3,
                    description: 'BANの理由',
                    required: true
                },
                {
                    name: 'user',
                    type: 6,
                    description: 'グローバルBANリストに追加するユーザー',
                    required: false
                },
                {
                    name: 'user_id',
                    type: 3,
                    description: 'グローバルBANリストに追加するユーザーID',
                    required: false
                }
            ]
        },
        {
            name: 'reload',
            type: 1,
            description: 'グローバルBANリストをリロードし、全サーバーに適用します'
        },
        {
            name: 'list',
            type: 1,
            description: 'グローバルBANリストを表示します'
        }
    ],
    async execute(interaction) {
        if (!config.adminIds.includes(interaction.user.id)) {
            return this.sendErrorEmbed(interaction, 'このコマンドを実行する権限がありません。', true);
        }

        const subcommand = interaction.options.getSubcommand();
        switch (subcommand) {
            case 'ban':
                await this.addToGbanList(interaction);
                break;
            case 'reload':
                await this.reloadGban(interaction);
                break;
            case 'list':
                await this.listGban(interaction);
                break;
        }
    },

    async addToGbanList(interaction) {
        await interaction.deferReply();
        const user = interaction.options.getUser('user');
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('reason');

        if (!user && !userId) {
            return this.sendErrorEmbed(interaction, 'ユーザーまたはユーザーIDを指定してください。');
        }

        try {
            let gbanList = await this.readGbanList();
            let targetUser;

            if (user) {
                targetUser = user;
            } else {
                try {
                    targetUser = await interaction.client.users.fetch(userId);
                } catch (error) {
                    return this.sendErrorEmbed(interaction, '指定されたユーザーIDが無効です。');
                }
            }

            if (gbanList.some(item => item.userId === targetUser.id)) {
                return this.sendErrorEmbed(interaction, 'このユーザーは既にグローバルBANリストに登録されています。');
            }

            gbanList.push({
                userId: targetUser.id,
                reason: reason,
                bannedBy: interaction.user.id,
                bannedAt: new Date().toISOString()
            });

            await fs.writeFile(GBAN_LIST_PATH, JSON.stringify(gbanList, null, 2));

            await this.sendSuccessEmbed(interaction, 
                `ユーザー ${targetUser.tag} (${targetUser.id}) をグローバルBANリストに追加しました。\n理由: ${reason}`
            );

            await this.applyGbanToAllServers(interaction.client, targetUser.id);
        } catch (error) {
            console.error('Error in gban command:', error);
            await this.sendErrorEmbed(interaction, 'グローバルBANの追加中にエラーが発生しました。');
        }
    },

    async reloadGban(interaction) {
        await interaction.deferReply();
        try {
            const gbanList = await this.readGbanList();
            for (const gbanEntry of gbanList) {
                await this.applyGbanToAllServers(interaction.client, gbanEntry.userId);
            }
            await this.sendSuccessEmbed(interaction, 'グローバルBANリストをリロードし、全サーバーに適用しました。');
        } catch (error) {
            console.error('Error in gban reload command:', error);
            await this.sendErrorEmbed(interaction, 'グローバルBANリストのリロード中にエラーが発生しました。');
        }
    },

    async listGban(interaction) {
        await interaction.deferReply();
        try {
            const gbanList = await this.readGbanList();
            const itemsPerPage = 10;
            const pages = Math.ceil(gbanList.length / itemsPerPage);

            let currentPage = 0;

            const generateEmbed = (page) => {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const currentItems = gbanList.slice(start, end);

                const embed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('グローバルBANリスト')
                    .setDescription(`ページ ${page + 1}/${pages}`)
                    .setFooter({ text: `${interaction.user.username} | ${new Date().toLocaleString()}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

                currentItems.forEach((item, index) => {
                    embed.addFields({ name: `${start + index + 1}. ${item.userId}`, value: `理由: ${item.reason}\nBAN実行者: <@${item.bannedBy}>\n日時: ${new Date(item.bannedAt).toLocaleString()}` });
                });

                return embed;
            };

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('previous')
                        .setLabel('前')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('次')
                        .setStyle(ButtonStyle.Primary)
                );

            const initialMessage = await interaction.editReply({
                embeds: [generateEmbed(currentPage)],
                components: [row]
            });

            const collector = initialMessage.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id === interaction.user.id) {
                    if (i.customId === 'previous') {
                        currentPage = currentPage > 0 ? --currentPage : pages - 1;
                    } else if (i.customId === 'next') {
                        currentPage = currentPage + 1 < pages ? ++currentPage : 0;
                    }
                    await i.update({
                        embeds: [generateEmbed(currentPage)],
                        components: [row]
                    });
                }
            });

            collector.on('end', () => {
                initialMessage.edit({ components: [] });
            });

        } catch (error) {
            console.error('Error in gban list command:', error);
            await this.sendErrorEmbed(interaction, 'グローバルBANリストの表示中にエラーが発生しました。');
        }
    },

    async readGbanList() {
        try {
            const data = await fs.readFile(GBAN_LIST_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    },

    async applyGbanToAllServers(client, userId) {
        for (const guild of client.guilds.cache.values()) {
            try {
                await guild.members.ban(userId, { reason: 'グローバルBAN' });
                console.log(`User ${userId} banned from ${guild.name}`);
            } catch (error) {
                console.error(`Failed to ban user ${userId} from ${guild.name}:`, error);
            }
        }
    },

    async sendErrorEmbed(interaction, message, ephemeral = false) {
        const errorEmbed = new EmbedBuilder()
            .setColor(0xff4d4d)
            .setAuthor({ name: 'Error', iconURL: 'https://faucetbot.net/images/failed.png' })
            .setDescription(message)
            .setFooter({ text: `${interaction.user.username} | ${new Date().toLocaleString()}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        if (interaction.deferred) {
            await interaction.editReply({ embeds: [errorEmbed] });
        } else {
            await interaction.reply({ embeds: [errorEmbed], ephemeral });
        }
    },

    async sendSuccessEmbed(interaction, message) {
        const successEmbed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setAuthor({ name: 'Success', iconURL: 'https://faucetbot.net/images/check.png' })
            .setDescription(message)
            .setFooter({ text: `${interaction.user.username} | ${new Date().toLocaleString()}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        await interaction.editReply({ embeds: [successEmbed] });
    }
};