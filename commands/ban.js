
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ban',
    description: '指定したユーザーをBANします。',
    options: [
        {
            name: 'user',
            type: 6,
            description: 'BANするユーザー',
            required: true,
        },
        {
            name: 'reason',
            type: 3,
            description: 'BANの理由',
            required: false,
        },
    ],
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || '理由なし';

        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setAuthor({
                    name: "権限がありません",
                    iconURL: "https://faucetbot.net/images/failed.png",
                })
                .setDescription('このコマンドを使用するにはBANの権限が必要です。')
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        try {
            await interaction.guild.members.ban(user, { reason });
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setAuthor({ name: 'Success', iconURL: 'https://faucetbot.net/images/check.png' })
                .setTitle('🔨 BAN')
                .setDescription(`${user.tag} をBANしました。`)
                .addFields({ name: '理由', value: reason })
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
                .setAuthor({
                    name: "error",
                    iconURL: "https://faucetbot.net/images/failed.png",
                })
                .setTitle('エラー')
                .setDescription('指定されたユーザーをBANできませんでした。')
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};