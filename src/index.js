import PubSub from './PubSub';
import fireLanes from './fireLanes';
import invaders from './invaders';
import gameServer from './gameServer';
import ship from './ship';
import ui from './ui';
import renderer from './renderer';

const pubsub = PubSub.create();

Promise.all([
    fireLanes.init(pubsub),
    invaders.init(pubsub),
    gameServer.init(pubsub),
    ship.init(pubsub),
    ui.init(pubsub),
    renderer.init(pubsub)
])
    .then(() => {
        pubsub.publish('gameReady')
    });

window.pubsub = pubsub;
