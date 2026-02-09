import { BASE_POSITIONS, HOME_ENTRANCE, HOME_POSITIONS, PLAYERS, SAFE_POSITIONS, START_POSITIONS, STATE, TURNING_POINTS } from './constants.js';
import { UI } from './UI.js';

export class Ludo {
    currentPositions = { P1: [], P2: [] };
    pendingBonusPiece = null; // guarda jogador que tem bônus +10 da Home
    _diceValue;
    _turn;
    _state;

    get diceValue() { return this._diceValue; }
    set diceValue(value) { 
        this._diceValue = value; 
        UI.setDiceValue(value); 
    }

    get turn() { return this._turn; }
    set turn(value) { 
        this._turn = value; 
        UI.setTurn(value); 
    }

    get state() { return this._state; }
    set state(value) { 
        this._state = value;
        if(value === STATE.DICE_NOT_ROLLED){
            UI.enableDice();
            UI.unhighlightPieces();
        } else UI.disableDice();
    }

    constructor(){
        this.listenDiceClick();
        this.listenResetClick();
        this.listenPieceClick();
        this.resetGame();
    }

    listenDiceClick(){ UI.listenDiceClick(this.onDiceClick.bind(this)); }

    onDiceClick(){
        this.diceValue = 1 + Math.floor(Math.random() * 6);
        this.state = STATE.DICE_ROLLED;
        this.checkForEligiblePieces();
    }

    checkForEligiblePieces(){
        const player = PLAYERS[this.turn];
        const eligible = this.getEligiblePieces(player);
        if(eligible.length) UI.highlightPieces(player, eligible);
        else this.incrementTurn();
    }

    incrementTurn(){ 
        this.turn = this.turn === 0 ? 1 : 0;
        this.state = STATE.DICE_NOT_ROLLED;
    }

    getEligiblePieces(player){
        return [0,1,2,3].filter(piece => {
            const pos = this.currentPositions[player][piece];
            if(pos === HOME_POSITIONS[player]) return false;
            if(BASE_POSITIONS[player].includes(pos) && this.diceValue !== 6) return false;
            if(HOME_ENTRANCE[player].includes(pos) && this.diceValue > HOME_POSITIONS[player]-pos) return false;
            return true;
        });
    }

    listenResetClick(){ UI.listenResetClick(this.resetGame.bind(this)); }

    resetGame(){
        this.currentPositions = structuredClone(BASE_POSITIONS);
        PLAYERS.forEach(player => [0,1,2,3].forEach(piece => this.setPiecePosition(player,piece,this.currentPositions[player][piece])));
        this.turn = 0;
        this.state = STATE.DICE_NOT_ROLLED;
        this.pendingBonusPiece = null;
    }

    listenPieceClick(){ UI.listenPieceClick(this.onPieceClick.bind(this)); }

    onPieceClick(event){
        const target = event.target;
        if(!target.classList.contains('player-piece') || !target.classList.contains('highlight')) return;
        const player = target.getAttribute('player-id');
        const piece = target.getAttribute('piece');
        this.handlePieceClick(player, piece);
    }

    handlePieceClick(player, piece){
        const pos = this.currentPositions[player][piece];

        // mover peça da base
        if(BASE_POSITIONS[player].includes(pos)){
            this.setPiecePosition(player,piece, START_POSITIONS[player]);
            this.state = STATE.DICE_NOT_ROLLED;
            return;
        }

        UI.unhighlightPieces();

        // Bônus +10 da Home
        if(this.pendingBonusPiece === player){
            this.pendingBonusPiece = null;
            this.movePiece(player, piece, 10, true); // true indica que é bônus da Home
            return;
        }

        // jogada normal
        this.movePiece(player, piece, this.diceValue);
    }

    setPiecePosition(player, piece, newPos){
        this.currentPositions[player][piece] = newPos;
        UI.setPiecePosition(player, piece, newPos);
    }

    movePiece(player, piece, moveBy, isHomeBonus=false){
        const interval = setInterval(()=>{
            this.incrementPiecePosition(player,piece);
            moveBy--;

            // entrou na Home durante jogada normal
            if(!isHomeBonus && this.currentPositions[player][piece] === HOME_POSITIONS[player]){
                clearInterval(interval);

                // notificação de bônus +10
                const outside = this.getPiecesOutsideBase(player);
                if(outside.length > 0){
                    this.pendingBonusPiece = player;
                    UI.showNotification("Você guardou uma peça! Escolha uma peça para andar 10 casas.");
                    UI.highlightPieces(player, outside);
                }

                this.state = STATE.DICE_NOT_ROLLED;
                return;
            }

            // fim da jogada normal ou do bônus
            if(moveBy === 0){
                clearInterval(interval);

                if(this.hasPlayerWon(player)){
                    alert(`Player: ${player} venceu!`);
                    this.resetGame();
                    return;
                }

                // se não for bônus da Home, verifica kill para iniciar bônus +20
                if(!isHomeBonus){
                    const isKill = this.checkForKill(player,piece);
                    if(isKill){
                        let bonus = 20;
                        const bonusInterval = setInterval(()=>{
                            this.incrementPiecePosition(player,piece);
                            bonus--;

                            // entrou na Home, para imediatamente
                            if(this.currentPositions[player][piece] === HOME_POSITIONS[player]){
                                clearInterval(bonusInterval);
                                this.state = STATE.DICE_NOT_ROLLED;
                                return;
                            }

                            // só verifica kill na última casa do bônus
                            if(bonus===0){
                                const killedAtEnd = this.checkForKill(player,piece);
                                if(killedAtEnd){
                                    bonus = 20; // reinicia bônus
                                    return;
                                }
                                clearInterval(bonusInterval);
                                this.state = STATE.DICE_NOT_ROLLED;
                            }

                        },150);
                        return;
                    }
                }

                if(!isHomeBonus){
                    if(this.diceValue === 6) this.state = STATE.DICE_NOT_ROLLED;
                    else this.incrementTurn();
                } else {
                    this.state = STATE.DICE_NOT_ROLLED; // bônus da Home termina
                }
            }

        },200);
    }

    checkForKill(player,piece){
        const pos = this.currentPositions[player][piece];
        const opponent = player==='P1'?'P2':'P1';
        let kill = false;
        [0,1,2,3].forEach(p=>{
            const oppPos = this.currentPositions[opponent][p];
            if(pos===oppPos && !SAFE_POSITIONS.includes(pos)){
                this.setPiecePosition(opponent,p,BASE_POSITIONS[opponent][p]);
                kill = true;
            }
        });
        return kill;
    }

    hasPlayerWon(player){
        return [0,1,2,3].every(p=>this.currentPositions[player][p]===HOME_POSITIONS[player]);
    }

    incrementPiecePosition(player,piece){
        this.setPiecePosition(player,piece,this.getIncrementedPosition(player,piece));
    }

    getIncrementedPosition(player,piece){
        const pos = this.currentPositions[player][piece];
        if(pos === TURNING_POINTS[player]) return HOME_ENTRANCE[player][0];
        if(pos === 51) return 0;
        return pos + 1;
    }

    getPiecesOutsideBase(player){
        return [0,1,2,3].filter(p=>{
            const pos = this.currentPositions[player][p];
            return !BASE_POSITIONS[player].includes(pos) && pos !== HOME_POSITIONS[player];
        });
    }
}
