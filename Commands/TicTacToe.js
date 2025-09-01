const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    PermissionsBitField
} = require("discord.js");

function makeBoard(boardState, customPrefix, disabled = false) {
    const rows = [];
    for (let i = 0; i < 3; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < 3; j++) {
            const index = i * 3 + j;
            const mark = boardState[index] || "⬜";
            let style = ButtonStyle.Secondary;
            if (mark === "X") style = ButtonStyle.Danger;
            else if (mark === "O") style = ButtonStyle.Primary;

            row.addComponents(
                new ButtonBuilder()
                .setCustomId(`${customPrefix}_${index}`)
                .setLabel(mark)
                .setStyle(style)
                .setDisabled(disabled || Boolean(boardState[index]))
            );
        }
        rows.push(row);
    }
    return rows;
}

function checkWinner(board) {
    const wins = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8], // rows
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8], // cols
        [0, 4, 8],
        [2, 4, 6] // diags
    ];
    for (const [a, b, c] of wins) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    if (board.every(cell => cell)) return 'draw';
    return null;
}

function minimax(board, player, depth = 0) {
    const winner = checkWinner(board);
    if (winner === 'O') return {
        score: 10 - depth
    };
    if (winner === 'X') return {
        score: depth - 10
    };
    if (winner === 'draw') return {
        score: 0
    };

    const avail = board
        .map((v, i) => (v ? null : i))
        .filter(i => i !== null);

    const moves = [];

    for (const index of avail) {
        board[index] = player;
        const nextPlayer = player === 'O' ? 'X' : 'O';
        const result = minimax(board, nextPlayer, depth + 1);
        moves.push({
            index,
            score: result.score
        });
        board[index] = null;
    }

    if (player === 'O') {
        let best = moves[0];
        for (const m of moves)
            if (m.score > best.score) best = m;
        return best;
    } else {
        let best = moves[0];
        for (const m of moves)
            if (m.score < best.score) best = m;
        return best;
    }
}

function chooseBotMove(board, difficulty) {
    const avail = board
        .map((v, i) => (v ? null : i))
        .filter(i => i !== null);

    if (avail.length === 0) return -1;

    const probBest = Math.max(0, Math.min(1, difficulty / 10));
    const pickBest = Math.random() < probBest;

    if (!pickBest) {
        return avail[Math.floor(Math.random() * avail.length)];
    }

    const copy = board.slice();
    const best = minimax(copy, 'O');
    if (best && typeof best.index === 'number') return best.index;

    return avail[Math.floor(Math.random() * avail.length)];
}

module.exports.execute = async function(interaction) {
    const difficulty = interaction.options?.getInteger?.('difficulty') ?? 5;
    if (typeof difficulty !== 'number' || difficulty < 1 || difficulty > 10) {
        return interaction.reply({
            content: "Invalid difficulty given (1-10).",
            ephemeral: true
        });
    }

    const boardState = [null, null, null, null, null, null, null, null, null];


    const prefix = `ttt_${interaction.id}`;

    await interaction.reply({
        content: `Tic Tac Toe — You are X. Difficulty: ${difficulty}\nClick a square to play.`,
        components: makeBoard(boardState, prefix),
    });

    const message = await interaction.fetchReply();
    const userId = interaction.user.id;

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000
    });

    collector.on('collect', async (btnInt) => {
        try {
            if (btnInt.user.id !== userId) {
                return btnInt.reply({
                    content: "This is not your game.",
                    ephemeral: true
                });
            }

            if (!btnInt.customId.startsWith(prefix + "_")) {
                return btnInt.reply({
                    content: "Invalid button for this game.",
                    ephemeral: true
                });
            }

            const index = Number(btnInt.customId.split('_').pop());
            if (Number.isNaN(index) || index < 0 || index > 8) {
                return btnInt.reply({
                    content: "Invalid cell.",
                    ephemeral: true
                });
            }

            if (boardState[index]) {
                return btnInt.reply({
                    content: "That cell is already taken.",
                    ephemeral: true
                });
            }

            boardState[index] = 'X';

            let result = checkWinner(boardState);
            if (result) {
                await btnInt.update({
                    content: result === 'draw' ? "It's a draw!" : `Game over — ${result} wins!`,
                    components: makeBoard(boardState, prefix, true),
                });
                collector.stop();
                return;
            }

            const botIndex = chooseBotMove(boardState, difficulty);
            if (botIndex >= 0) boardState[botIndex] = 'O';

            result = checkWinner(boardState);
            if (result) {
                await btnInt.update({
                    content: result === 'draw' ? "It's a draw!" : `Game over — ${result} wins!`,
                    components: makeBoard(boardState, prefix, true),
                });
                collector.stop();
                return;
            }

            await btnInt.update({
                content: `Tic Tac Toe — You are X. Difficulty: ${difficulty}\nYour move.`,
                components: makeBoard(boardState, prefix),
            });

        } catch (err) {
            console.error("Collector error:", err);
            try {
                await btnInt.reply({
                    content: "An error occurred.",
                    ephemeral: true
                });
            } catch (e) {}
            collector.stop();
        }
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            try {
                await message.edit({
                    content: "Game ended (timed out).",
                    components: makeBoard(boardState, prefix, true)
                });
            } catch (err) {}
        }
    });
};