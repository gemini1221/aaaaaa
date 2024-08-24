// commands/clear.js
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'clear',
    description: '指定した数のメッセージを削除します。',
    options: [
        {
            name: 'amount',
            type: 4,
            description: '削除するメッセージの数',
            required: true,
        },
    ],
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription('このコマンドを使用するにはメッセージ管理の権限が必要です。')
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (amount < 1 || amount > 1000) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('1から1000の間で指定してください。')
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            let deletedMessages = 0;
            while (deletedMessages < amount) {
                const deleteCount = Math.min(amount - deletedMessages, 100);
                const deleted = await interaction.channel.bulkDelete(deleteCount, true);
                deletedMessages += deleted.size;

                if (deleted.size < deleteCount) break;
            }

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                
                .setTitle('🧹 メッセージ削除')
                .setDescription(`${deletedMessages}件のメッセージを削除しました。`)
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                
                .setTitle('エラー')
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};