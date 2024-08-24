const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'roll',
    description: 'サイコロを振って結果を表示します。',
    options: [
        {
            name: 'sides',
            type: 4, // INTEGER type
            description: 'サイコロの面数 (デフォルトは6)',
            required: false,
        },
        {
            name: 'count',
            type: 4, // INTEGER type
            description: '振るサイコロの個数 (デフォルトは1)',
            required: false,
        },
    ],
    async execute(interaction) {
        const sides = interaction.options.getInteger('sides') || 6;
        const count = interaction.options.getInteger('count') || 1;
    
        if (sides < 1) {
            return interaction.reply({ content: 'サイコロの面数は1以上で指定してください。', ephemeral: true });
        }
        
        if (count < 1) {
            return interaction.reply({ content: '振るサイコロの個数は1以上で指定してください。', ephemeral: true });
        }
    
        const rolls = [];
        let total = 0;
        for (let i = 0; i < count; i++) {
            const roll = Math.floor(Math.random() * sides) + 1;
            rolls.push(roll);
            total += roll;
        }
    
        const embed = new EmbedBuilder()
            .setColor(0x7fff7f)
            .setTitle('🎲 サイコロ')
            .setDescription(`サイコロの結果: ${rolls.join(', ')}`)
            .addFields(
                { name: '合計', value: total.toString() }
            )
            .setFooter({
                text: `roll | ${new Date().toLocaleString()}`,
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();
    
        await interaction.reply({ embeds: [embed] });
    },
};
