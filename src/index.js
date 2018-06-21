import PubSub from './PubSub';
import invaders from './invaders';
import gameServer from './gameServer';
import renderer from './renderer';

const pubsub = PubSub.create();

Promise.all([
    invaders.init(pubsub),
    gameServer.init(pubsub),
    renderer.init(pubsub)
])
    .then(() => {
        pubsub.publish('gameReady')
    });

window.pubsub = pubsub;
