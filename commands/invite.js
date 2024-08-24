const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'invite',
    description: 'サーバー招待リンクを作成します',
    options: [
        {
            name: '期限',
            type: 3, // 3は文字列タイプ
            description: '招待リンクの有効期限を設定します',
            choices: [
                { name: '30分', value: '1800' },
                { name: '1時間', value: '3600' },
                { name: '6時間', value: '21600' },
                { name: '12時間', value: '43200' },
                { name: '1日', value: '86400' },
                { name: '7日', value: '604800' },
                { name: '期限なし', value: '0' }
            ]
        },
        {
            name: '最大使用回数',
            type: 3, // 3は文字列タイプ
            description: '招待リンクの最大使用回数を設定します',
            choices: [
                { name: '1回', value: '1' },
                { name: '5回', value: '5' },
                { name: '10回', value: '10' },
                { name: '25回', value: '25' },
                { name: '50回', value: '50' },
                { name: '100回', value: '100' },
                { name: '数制限なし', value: '0' }
            ]
        },
        {
            name: '一時メンバー',
            type: 5, // 5はブールタイプ
            description: '一時的なメンバーとして招待するかどうかを設定します'
        }
    ],
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const { channel, guild, member, options, user } = interaction;

            if (!channel.permissionsFor(user).has(PermissionFlagsBits.CreateInstantInvite)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff4d4d)
                    .setDescription('あなたには招待リンクを作成する権限がありません。')
                    .setFooter({ text: `${user.username} | ${new Date().toLocaleString()}`, iconURL: user.displayAvatarURL({ dynamic: true }) });

                await interaction.editReply({ embeds: [errorEmbed] })
                setTimeout(() => interaction.deleteReply(), 3000);
                return;
            }

            if (!channel.permissionsFor(guild.members.me).has(PermissionFlagsBits.CreateInstantInvite)) {
                const errorEmbed = new EmbedBuilder()
                    .setColor(0xff4d4d)
                    .setDescription('ボットに招待リンクを作成する権限がありません。')
                    .setFooter({ text: `${user.username} | ${new Date().toLocaleString()}`, iconURL: user.displayAvatarURL({ dynamic: true }) });

                await interaction.editReply({ embeds: [errorEmbed] })
                setTimeout(() => interaction.deleteReply(), 3000);
                return;
            }

            const maxAge = options.getString('期限') || '0';
            const maxUses = options.getString('最大使用回数') || '0';
            const temporary = options.getBoolean('一時メンバー') || false;

            const formatMaxAge = (age) => {
                if (age === '0') return '期限なし';
                if (age < 3600) return `${age / 60}分`;
                if (age < 86400) return `${age / 3600}時間`;
                return `${age / 86400}日`;
            };

            const invite = await channel.createInvite({
                maxAge: parseInt(maxAge, 10),
                maxUses: parseInt(maxUses, 10),
                temporary,
                unique: true
            });

            const inviteEmbed = new EmbedBuilder()
                .setColor(0x7fff7f)
                .setAuthor({ name: 'Success', iconURL: 'https://faucetbot.net/images/check.png' })
                .setDescription(`\`\`\`${invite.url}\`\`\``)
                .addFields(
                    { name: '期限', value: maxAge === '0' ? '期限なし' : formatMaxAge(maxAge), inline: true },
                    { name: '最大使用回数', value: maxUses === '0' ? '数制限なし' : `${maxUses}回`, inline: true },
                    { name: '一時メンバー', value: temporary ? 'Yes' : 'No', inline: true }
                )
                .setFooter({ text: `${user.username} | ${new Date().toLocaleString()}`, iconURL: user.displayAvatarURL({ dynamic: true }) });

            await interaction.editReply({ embeds: [inviteEmbed] });
        } catch (error) {
            const errorEmbed = new EmbedBuilder()
                .setColor(0xff4d4d)
                .setAuthor({ name: 'Error', iconURL: 'https://faucetbot.net/images/failed.png' })
                .setDescription('エラーが発生しました。')
                .setFooter({ text: `${user.username} | ${new Date().toLocaleString()}`, iconURL: user.displayAvatarURL({ dynamic: true }) });

            console.error(error);
            await interaction.editReply({ embeds: [errorEmbed], ephemeral: true })
            setTimeout(() => interaction.deleteReply(), 3000);
        }
    }
};
