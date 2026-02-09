import { BASE_POSITIONS, HOME_ENTRANCE, HOME_POSITIONS, PLAYERS, SAFE_POSITIONS, START_POSITIONS, STATE, TURNING_POINTS } from './constants.js';
import { UI } from './UI.js';

export class Ludo {
    currentPositions = {
        P1: [],
        P2: []
    }

    // 👇 NOVO: guarda quem tem bônus de +10
    pendingBonusPiece = null;

    _diceValue;
    get diceValue() {
        return this._diceValue;
    }
    set diceValue(value) {
        this._diceValue = value;
        UI.setDiceValue(value);
    }

    _turn;
    get turn() {
        return this._turn;
    }
    set turn(value) {
        this._turn = value;
        UI.setTurn(value);
    }

    _state;
    get state() {
        return this._state;
    }
    set state(value) {
        this._state = value;

        if (value === STATE.DICE_NOT_ROLLED) {
            UI.enableDice();
            UI.unhighlightPieces();
        } else {
            UI.disableDice();
        }
    }

    constructor() {
        this.listenDiceClick();
        this.listenResetClick();
        this.listenPieceClick();
        this.resetGame();
    }

    listenDiceClick() {
        UI.listenDiceClick(this.onDiceClick.bind(this))
    }

    onDiceClick() {
        this.diceValue = 1 + Math.floor(Math.random() * 6);
        this.state = STATE.DICE_ROLLED;
        this.checkForEligiblePieces();
    }

    checkForEligiblePieces() {
        const player = PLAYERS[this.turn];
        const eligiblePieces = this.getEligiblePieces(player);

        if (eligiblePieces.length) {
            UI.highlightPieces(player, eligiblePieces);
        } else {
            this.incrementTurn();
        }
    }

    incrementTurn() {
        this.turn = this.turn === 0 ? 1 : 0;
        this.state = STATE.DICE_NOT_ROLLED;
    }

    getEligiblePieces(player) {
        return [0, 1, 2, 3].filter(piece => {
            const currentPosition = this.currentPositions[player][piece];

            if (currentPosition === HOME_POSITIONS[player]) return false;

            if (BASE_POSITIONS[player].includes(currentPosition) && this.diceValue !== 6) {
                return false;
            }

            if (
                HOME_ENTRANCE[player].includes(currentPosition)
                && this.diceValue > HOME_POSITIONS[player] - currentPosition
            ) {
                return false;
            }

            return true;
        });
    }

    listenResetClick() {
        UI.listenResetClick(this.resetGame.bind(this))
    }

    resetGame() {
        this.currentPositions = structuredClone(BASE_POSITIONS);

        PLAYERS.forEach(player => {
            [0, 1, 2, 3].forEach(piece => {
                this.setPiecePosition(player, piece, this.currentPositions[player][piece])
            })
        });

        this.turn = 0;
        this.state = STATE.DICE_NOT_ROLLED;
        this.pendingBonusPiece = null;
    }

    listenPieceClick() {
        UI.listenPieceClick(this.onPieceClick.bind(this));
    }

    onPieceClick(event) {
        const target = event.target;

        if (!target.classList.contains('player-piece') || !target.classList.contains('highlight')) {
            return;
        }

        const player = target.getAttribute('player-id');
        const piece = target.getAttribute('piece');
        this.handlePieceClick(player, piece);
    }

    handlePieceClick(player, piece) {
        const currentPosition = this.currentPositions[player][piece];

        if (BASE_POSITIONS[player].includes(currentPosition)) {
            this.setPiecePosition(player, piece, START_POSITIONS[player]);
            this.state = STATE.DICE_NOT_ROLLED;
            return;
        }

        UI.unhighlightPieces();

        // 🔥 SE ESTÁ ESCOLHENDO PEÇA PARA +10
        if (this.pendingBonusPiece === player) {
            this.pendingBonusPiece = null;
            this.movePiece(player, piece, 10);
            return;
        }

        // jogada normal
        this.movePiece(player, piece, this.diceValue);
    }

    setPiecePosition(player, piece, newPosition) {
        this.currentPositions[player][piece] = newPosition;
        UI.setPiecePosition(player, piece, newPosition)
    }

    movePiece(player, piece, moveBy) {
        const interval = setInterval(() => {
            this.incrementPiecePosition(player, piece);
            moveBy--;

            if (moveBy === 0) {
                clearInterval(interval);

                // vitória?
                if (this.hasPlayerWon(player)) {
                    alert(`Player: ${player} venceu!`);
                    this.resetGame();
                    return;
                }

                // REGRA NOVA: entrou na HOME → ganha +10 em outra peça
                if (this.currentPositions[player][piece] === HOME_POSITIONS[player]) {

                    const outside = this.getPiecesOutsideBase(player);

                    if (outside.length > 0) {
                        this.pendingBonusPiece = player;
                        UI.highlightPieces(player, outside);
                        return;
                    }
                }

                // verifica captura
                const isKill = this.checkForKill(player, piece);

                if (isKill) {
    let extra = 20;

    const extraInterval = setInterval(() => {

        // anda 1 casa
        this.incrementPiecePosition(player, piece);
        extra--;

        // 🔥 REGRA PRINCIPAL: entrou na HOME? PARA TUDO
        if (this.currentPositions[player][piece] === HOME_POSITIONS[player]) {
            clearInterval(extraInterval);
            this.state = STATE.DICE_NOT_ROLLED; // segue jogo normal
            return;
        }

        // verifica se comeu alguém NESTA CASA
        const killedAgain = this.checkForKill(player, piece);

        // se comeu → RENOVA o bônus para mais 20
        if (killedAgain) {
            extra = 20;
        }

        // acabou os 20 passos sem entrar na home
        if (extra === 0) {
            clearInterval(extraInterval);
            this.state = STATE.DICE_NOT_ROLLED;
        }

    }, 150);

    return;
}



                if (this.diceValue === 6) {
                    this.state = STATE.DICE_NOT_ROLLED;
                    return;
                }

                this.incrementTurn();
            }
        }, 200);
    }

    checkForKill(player, piece) {
        const currentPosition = this.currentPositions[player][piece];
        const opponent = player === 'P1' ? 'P2' : 'P1';

        let kill = false;

        [0, 1, 2, 3].forEach(p => {
            const opponentPosition = this.currentPositions[opponent][p];

            if (currentPosition === opponentPosition && !SAFE_POSITIONS.includes(currentPosition)) {
                this.setPiecePosition(opponent, p, BASE_POSITIONS[opponent][p]);
                kill = true;
            }
        });

        return kill;
    }

    hasPlayerWon(player) {
        return [0, 1, 2, 3].every(piece =>
            this.currentPositions[player][piece] === HOME_POSITIONS[player]
        );
    }

    incrementPiecePosition(player, piece) {
        this.setPiecePosition(player, piece, this.getIncrementedPosition(player, piece));
    }

    getIncrementedPosition(player, piece) {
        const currentPosition = this.currentPositions[player][piece];

        if (currentPosition === TURNING_POINTS[player]) {
            return HOME_ENTRANCE[player][0];
        }
        else if (currentPosition === 51) {
            return 0;
        }
        return currentPosition + 1;
    }

    // 🔥 NOVA FUNÇÃO: pega peças fora da base
    getPiecesOutsideBase(player) {
        return [0, 1, 2, 3].filter(piece => {
            const pos = this.currentPositions[player][piece];
            return !BASE_POSITIONS[player].includes(pos)
                && pos !== HOME_POSITIONS[player];
        });
    }
}
