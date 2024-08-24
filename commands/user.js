const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'user',
    description: 'ユーザーの詳細情報を表示します。',
    options: [
        {
            name: 'target',
            type: 6,
            description: '情報を表示するユーザーを選択します',
            required: false
        }
    ],
    async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(user.id);
        
        const roles = member.roles.cache.sort((a, b) => b.position - a.position).map(role => role.toString());
        const userFlags = user.flags.toArray();
        const activity = member.presence?.activities[0];

        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor || 0x7fff7f)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: 'ユーザー名', value: user.username, inline: true },
                { name: 'タグ', value: user.discriminator, inline: true },
                { name: 'ニックネーム', value: member.nickname || 'なし', inline: true },
                { name: 'ID', value: user.id, inline: true },
                { name: 'アカウント作成日', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: 'サーバー参加日', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'バッジ', value: userFlags.length ? userFlags.map(flag => `\`${flag}\``).join(', ') : 'なし', inline: true },
                { name: 'ブースト開始日', value: member.premiumSince ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>` : 'ブーストしていません', inline: true },
                { name: '主要な権限', value: member.permissions.toArray().map(perm => `\`${perm}\``).join(', ') || 'なし' },
                { name: `役職 [${roles.length - 1}]`, value: roles.length < 10 ? roles.join(', ') : roles.length > 10 ? `${roles.slice(0, 10).join(', ')}...` : 'なし' },
            )
            .setFooter({
                text: `${interaction.user.username} | ${new Date().toLocaleString()}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        if (activity) {
            embed.addField('アクティビティ', `${activity.type} ${activity.name}`, true);
        }

        await interaction.reply({ embeds: [embed] });
    },
};