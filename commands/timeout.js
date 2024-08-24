const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'timeout',
    description: '指定されたユーザーを指定された秒数だけタイムアウトします',
    options: [
        {
            name: 'user',
            type: 6, // 6はユーザータイプ
            description: 'タイムアウトするユーザー',
            required: true
        },
        {
            name: 'seconds',
            type: 4, // 4は整数タイプ
            description: 'タイムアウトする秒数',
            required: true
        }
    ],
    defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const seconds = interaction.options.getInteger('seconds');

        if (seconds <= 0) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff4d4d)

                .setDescription('秒数は1以上の整数で指定してください。')
                .setFooter({ text: `${interaction.user.username} | ${new Date().toLocaleString()}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        try {
            const member = await interaction.guild.members.fetch(user.id);
            await member.timeout(seconds * 1000, `タイムアウトされた: ${interaction.user.tag} によるタイムアウト`);

            const successEmbed = new EmbedBuilder()
                .setColor(0x7fff7f)

                .setDescription(`${user.tag} は ${seconds} 秒間タイムアウトされました。`)
                .setFooter({ text: `${interaction.user.username} | ${new Date().toLocaleString()}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            await interaction.reply({ embeds: [successEmbed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff4d4d)

                .setDescription('ユーザーをタイムアウトする際にエラーが発生しました。')
                .setFooter({ text: `${interaction.user.username} | ${new Date().toLocaleString()}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

            console.error(error);
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
};