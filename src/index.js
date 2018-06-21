import PubSub from './PubSub';
import gameServer from './gameServer';

const pubsub = PubSub.create();

gameServer.init(pubsub);
