
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'ユーザーのアバターを表示します。',
    options: [
        {
            name: 'user',
            type: 6, 
            description: 'アバターを表示するユーザー',
            required: false
        }
    ],
    async execute(interaction) {
        try {
            const user = interaction.options.getUser('user') || interaction.user;
            const avatarUrl = user.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 });
            
            const embed = new EmbedBuilder()
                 .setColor(0x7fff7f)
   
                 .setTitle(` ${user.username}のアバター`)
                 .setDescription(`[Avatar URL](${avatarUrl})`)
                 .setImage(avatarUrl)
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
                .setDescription('アバターの取得中にエラーが発生しました。')
                .setTimestamp()
                .setFooter({
                    text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                });
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};