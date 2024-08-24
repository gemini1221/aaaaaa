const { Client, EmbedBuilder } = require('discord.js');

// メッセージ削除を追跡するためのMap
const snipeMap = new Map();

module.exports = {
    name: 'snipe',
    description: '最後に削除されたメッセージを表示します',
    options: [],
    
    // 初期化関数を追加
    init(client) {
        // メッセージ削除イベントリスナー
        client.on('messageDelete', message => {
            snipeMap.set(message.channel.id, {
                content: message.content,
                author: message.author,
                timestamp: message.createdTimestamp,
                attachments: message.attachments.first() ? message.attachments.first().url : null
            });
        });
    },

    async execute(interaction) {
        const snipedMessage = snipeMap.get(interaction.channel.id);

        if (!snipedMessage) {
            const noMessageEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                
                .setTitle('このチャンネルで最近削除されたメッセージはありません。')
                .setFooter({
                    text: `snipe | ${new Date().toLocaleString()}`,
                    iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
                })
                .setTimestamp();

            return interaction.reply({ embeds: [noMessageEmbed], ephemeral: true });
        }

        const timeSinceDeleted = Math.floor((Date.now() - snipedMessage.timestamp) / 1000);

        const embed = new EmbedBuilder()
            .setColor('#FF6347')
            .setAuthor({
                name: snipedMessage.author.tag,
                iconURL: snipedMessage.author.displayAvatarURL({ dynamic: true })
            })
            .setTitle('削除されたメッセージを復元')
            .setDescription(snipedMessage.content || '(内容なし)')
            .addFields(
                { name: '削除された時間', value: `${timeSinceDeleted}秒前`, inline: true },
                { name: 'チャンネル', value: `<#${interaction.channel.id}>`, inline: true }
            )
            .setFooter({
                text: `snipe | ${new Date().toLocaleString()}`,
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        if (snipedMessage.attachments) {
            embed.setImage(snipedMessage.attachments);
            embed.addFields({ name: '添付ファイル', value: '↓ 以下の画像が添付されていました ↓' });
        }

        await interaction.reply({ embeds: [embed] });
    },
};