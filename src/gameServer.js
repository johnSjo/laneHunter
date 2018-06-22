
const STATES = {
    IDLE: 'idle',
    MAIN: 'main',
    FINAL_ATTACK_WIN: 'finalAttackWin',
    FINAL_ATTACK_LOOSE: 'finalAttackLoose'
}

const BET_LEVELS = [10, 20, 50, 100, 200, 500, 1000, 5000];

const NR_OF_INVADERS = 3;

const MAX_INVADER_ROWS = 4;

const ALIEN_TYPES = [
    { value: 'standard', occurrence: 100 },
    { value: 'explosive', occurrence: 50 },
    { value: 'dummy', occurrence: 10 }
];

const ALIEN_STATES = {
    ALIVE: 'alive',
    KILLED: 'killed',
    EXPLODED: 'exploded',
    DESTROYED: 'destroyed'
}

const VALUES_TYPES = [
    { value: 0.1, occurrence: 1000 },
    { value: 0.2, occurrence: 500 },
    { value: 0.5, occurrence: 200 },
    { value: 1, occurrence: 100 },
    { value: 2, occurrence: 50 },
    { value: 5, occurrence: 20 },
    { value: 10, occurrence: 10 },
    { value: 25, occurrence: 4 },
    { value: 100, occurrence: 1 }
];

const EXPLOSION_PATTERNS = [
    { 
        value: [
            { x: -1, y: 0 },
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 }
        ],
        occurrence: 100
    },
    { 
        value: [
            { x: 0, y: 1 },
            { x: 0, y: 2 },
            { x: 0, y: 3 },
            { x: 0, y: 4 }
        ],
        occurrence: 10
    },
    { 
        value: [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: -2, y: 0 }
        ],
        occurrence: 10
    }
];

function createInvaders () {
    return Array(NR_OF_INVADERS).fill(null).map(() => createAlien());
}

function createAlien () {
    const type = getType(ALIEN_TYPES);
    const value = type !== 'dummy' ? getType(VALUES_TYPES) : 0;
    const pattern = type === 'explosive' ? getType(EXPLOSION_PATTERNS) : null;

    return {
        type,
        value,
        pattern,
        state: ALIEN_STATES.ALIVE,
        win: null
    }
}

function getType (types) {
    const chances = types.reduce((acc, type) => {
        if (acc.length > 0) {
            acc.push(acc[acc.length - 1] + type.occurrence);
        } else {
            acc.push(type.occurrence);
        }

        return acc;
    }, []);
    const roll = Math.random() * chances[chances.length - 1];
    const value = types[chances.findIndex((value) => roll < value)].value;

    return value;
}

function createClientInvaders (invaders) {
    // strip everything exept 'state', 'win' and 'pos' from the alien info

    const clientInvaders = {};

    Object.entries(invaders).forEach(([key, data]) => {
        clientInvaders[key] = invaders[key].map((alien) => {
            return {
                state: alien.state,
                win: alien.win,
                pos: alien.pos
            };
        });
    });

    return clientInvaders;
}

function startNewRound (game, pubsub) {
    if (game.balance - game.betLevel > 0) {
        game.invaders = [createInvaders()];
        game.balance -= game.betLevel;
        game.state = STATES.MAIN;
        game.winnings.round = 0;
        game.winnings.attack = 0;

        const clientData = { ...game, invaders: null, aliensPerRow: game.invaders[0].length };

        pubsub.publish('startRound', JSON.stringify(clientData));
    } else {
        pubsub.publish('notEnoughMoneyToPlaceBet');
    }
}

function hitAlien (aliensHitted, invaders, pos, level, game) {
    const { winnings, betLevel } = game;
    const alien = invaders[pos.row][pos.col];
    const explodeAlien = () => {
        alien.pattern.forEach((vector) => {
            // if we have a 'alive' alien at the current vector -> hit it at level + 1
            const xPos = vector.x + pos.col;
            const yPos = vector.y + pos.row;

            if (yPos >= 0 && yPos < invaders.length && xPos >= 0 && xPos < invaders[yPos].length) {
                if (invaders[yPos][xPos].state === ALIEN_STATES.ALIVE) {
                    hitAlien (aliensHitted, invaders, { row: yPos, col: xPos }, level + 1, game);
                }
            }
        });
    };

    switch (alien.type) {
        case 'standard':
            alien.state = ALIEN_STATES.KILLED;
            break;
        case 'dummy':
            alien.state = ALIEN_STATES.DESTROYED;
            break;
        case 'explosive':
            alien.state = ALIEN_STATES.EXPLODED;
            explodeAlien();
            break;
    }
    
    alien.win = alien.value * betLevel;
    alien.pos = pos;
    winnings.attack += alien.win;

    if (aliensHitted[level]) {
        aliensHitted[level].push(alien);
    } else {
        aliensHitted[level] = [alien];
    }
}

function attackInvaders (game, lane) {

    const { invaders, winnings } = game;
    const aliensHitted = {};
    
    winnings.attack = 0;

    const alienHitIndex = invaders.findIndex((row) => row[lane].state === ALIEN_STATES.ALIVE);

    // just if we hit anything at all
    if (alienHitIndex > -1) {
        hitAlien(
            aliensHitted,
            invaders,
            { row: alienHitIndex, col: lane },
            0,
            game
        );
    }

    console.log(JSON.stringify(aliensHitted, null, 4));

    const clientInvaders = createClientInvaders(aliensHitted);

    game.balance += winnings.attack;
    winnings.round += winnings.attack;

    const aliensLeft = invaders.find((row) => {
        return row.find((alien) => alien.state === ALIEN_STATES.ALIVE);
    });

    if (aliensLeft) {
        invaders.forEach((row) => {
            row.forEach((alien) => {
                alien.win = null;
                alien.pos = null;
            });
        });
        
        invaders.push(createInvaders());

        const aliensReachedPlayer = invaders.slice().reverse().find((row, index) => {
            if (index >= MAX_INVADER_ROWS) {
                return row.find((alien) => alien.state === ALIEN_STATES.ALIVE);
            } else {
                return false;
            }
        });

        if (aliensReachedPlayer) {
            game.state = STATES.FINAL_ATTACK_LOOSE;
            console.log('You loose this round');
        }
    } else {
        invaders.push(createInvaders());
        game.state = STATES.FINAL_ATTACK_WIN;
        console.log('You WIN!! this round');
    }

    const clientData = {
        ...game,
        invaders: clientInvaders
    };

    pubsub.publish('attackResponse', JSON.stringify(clientData));

}

export default {

    init (pubsub) {
        const game = {
            state: STATES.IDLE,
            balance: 50000,
            betLevel: 100,
            invaders: [],
            winnings: {
                round: 0,
                attack: 0
            }
        }

        pubsub.subscribeOnce('gameReady', () => {

            pubsub.subscribe('tryToStartNewRound', () => {
                startNewRound(game, pubsub);
            });

            pubsub.subscribe('updateBetLevel', (bet) => {
                if (BET_LEVELS.includes(bet)) {
                    game.betLevel = bet;
                }
            });
    
            pubsub.subscribe('fireAtInvaders', (lane) => {
                pubsub.publish('holdShip/fire', 'attacking');
                attackInvaders(game, lane);
            });

        });

    }

}