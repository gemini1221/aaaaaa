// commands/kick.js
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'kick',
    description: '指定したユーザーをキックします。',
    options: [
        {
            name: 'user',
            type: 6,
            description: 'キックするユーザー',
            required: true,
        },
        {
            name: 'reason',
            type: 3,
            description: 'キックの理由',
            required: false,
        },
    ],
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || '理由なし';
        const member = interaction.guild.members.cache.get(user.id);
        if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                
                .setDescription('このコマンドを使用するにはあなたにキックの権限が必要です。')
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
            await interaction.reply({ embeds: [embed] });
            setTimeout(() => interaction.deleteReply(), 3000);
            return;
        }

        if (member) {
            await member.kick(reason);
            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                
                .setTitle('👢 キック')
                .setDescription(`${user.tag} をキックしました。`)
                .addFields({ name: '理由', value: reason })
                .setFooter({
                    text: `kick | ${new Date().toLocaleString()}`,
                    iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            await interaction.reply('指定されたユーザーはこのサーバーに存在しません。');
        }
    },
};
