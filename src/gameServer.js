
const STATES = {
    IDLE: 'idle',
    MAIN: 'main',
    FINAL_ATTACK_WIN: 'finalAttackWin',
    FINAL_ATTACK_LOOSE: 'finalAttackLoose'
}

const NR_OF_INVADERS = 3;

const MAX_INVADER_ROWS = 5;

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
        state: ALIEN_STATES.ALIVE
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

function startNewRound (game, pubsub) {
    if (game.balance - game.betLevel > 0) {
        game.invaders.push(createInvaders());
        game.balance -= game.betLevel;
        game.state = STATES.MAIN;

        // strip everything exept 'state' from the invader info
        const clientInvaders = game.invaders.map((invaderRow) => {
            return invaderRow.map((alien) => ({ state: alien.state }));
        });

        const clientData = { ...game, invaders: clientInvaders };

        pubsub.publish('startRound', JSON.stringify(clientData));
    } else {
        pubsub.publish('notEnoughMoneyToPlaceBet');
    }
}

function attackInvaders (lane) {

    // find first 'alive' aliens in the attacked lane
        // check type to see what happens
            // 'standard' -> kill it and award value * betLevel
            // 'dummy' -> destroy but give no award
    // if no 'alive' alien is found -> 

    // create clientInvaders

    // removed all killed and destroyed aliens from invaders

    // check if there are any 'alive' alien left
        // yes:
            // add a new row
            // check if any 'alive' alien have reached MAX_INVADER_ROWS
                // Yes: end round FINAL_ATTACK_LOOSE
                // No: let the player attack again
        // no:
            // end round FINAL_ATTACK_WIN

    // send attackResponse

}

export default {

    init (pubsub) {
        const game = {
            state: STATES.IDLE,
            balance: 5000,
            betLevel: 100,
            invaders: []
        }

        pubsub.subscribe('tryToStartNewRound', () => {
            startNewRound(game, pubsub);
        });

        pubsub.subscribe('fireAtInvaders', (lane) => {
            attackInvaders(lane);
        });

        pubsub.subscribe('startRound', (data) => {
            console.log(data);
        });

        pubsub.publish('tryToStartNewRound');
    }

}