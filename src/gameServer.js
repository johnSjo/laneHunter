
const STATES = {
    IDLE: 'idle',
    MAIN: 'main',
    FINAL_ATTACK_WIN: 'finalAttackWin',
    FINAL_ATTACK_LOOSE: 'finalAttackLoose'
}

const NR_OF_INVADERS = 3;

const MAX_INVADER_ROWS = 4;

const ALIEN_TYPES = [
    { value: 'standard', occurrence: 100 },
    { value: 'dummy', occurrence: 10 }
];

const ALIEN_STATES = {
    ALIVE: 'alive',
    KILLED: 'killed',
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

function createInvaders () {
    return Array(NR_OF_INVADERS).fill(null).map(() => createAlien());
}

function createAlien () {
    return {
        type: getType(ALIEN_TYPES),
        value: getType(VALUES_TYPES),
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
    // strip everything exept 'state' and 'win from the invader info
    return invaders.map((invaderRow) => {
        return invaderRow.map((alien) => ({
            state: alien.state,
            win: alien.win
        }));
    });
}

function startNewRound (game, pubsub) {
    if (game.balance - game.betLevel > 0) {
        game.invaders.push(createInvaders());
        game.balance -= game.betLevel;
        game.state = STATES.MAIN;

        const clientInvaders = createClientInvaders(game.invaders);

        const clientData = { ...game, invaders: clientInvaders };

        pubsub.publish('startRound', JSON.stringify(clientData));
    } else {
        pubsub.publish('notEnoughMoneyToPlaceBet');
    }
}

function attackInvaders (game, lane) {

    const { invaders } = game;

    let totalWinnigs = 0;

    const alienHitIndex = invaders.findIndex((row) => row[lane].state === ALIEN_STATES.ALIVE);
    if (alienHitIndex > -1) {
        const alien = invaders[alienHitIndex][lane];

        switch (alien.type) {
            case 'standard':
                alien.win = alien.value * game.betLevel;
                alien.state = ALIEN_STATES.KILLED;
                totalWinnigs += alien.win;
                break;
            case 'dummy':
                alien.win = 0;
                alien.state = ALIEN_STATES.DESTROYED;
                break;
        }
    }

    const clientInvaders = createClientInvaders(invaders);

    game.balance += totalWinnigs;

    const aliensLeft = invaders.find((row) => {
        return row.find((alien) => alien.state === ALIEN_STATES.ALIVE);
    });

    if (aliensLeft) {
        invaders.forEach((row) => {
            row.forEach((alien) => {
                alien.win = null;
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
        game.state = STATES.FINAL_ATTACK_WIN;
    }

    const clientData = { ...game, invaders: clientInvaders, totalWinnigs };

    pubsub.publish('attackResponse', JSON.stringify(clientData));

}

export default {

    init (pubsub) {
        const game = {
            state: STATES.IDLE,
            balance: 5000,
            betLevel: 100,
            invaders: []
        }

        pubsub.subscribeOnce('gameReady', () => {

            pubsub.subscribe('tryToStartNewRound', () => {
                startNewRound(game, pubsub);
            });
    
            pubsub.subscribe('fireAtInvaders', (lane) => {
                attackInvaders(game, lane);
            });

            startNewRound(game, pubsub);
        });

    }

}