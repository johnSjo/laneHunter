import * as PIXI from 'pixi.js';
import { getRenderLayer } from './renderer'

const NR_OF_LANES = 3;
const ALIEN_SIZE = 160

function createLane (layer, index, pubsub) {
    const graphics = new PIXI.Graphics();

    graphics.beginFill(0x555555);

    graphics.lineStyle(10, 0x666666);

    graphics.drawRect(index * (ALIEN_SIZE * 1.1), 0, ALIEN_SIZE, 1000);

    graphics.alpha = 0.3;
    graphics.interactive = true;

    graphics.on('pointerover', () => {
        graphics.alpha = 1
        pubsub.publish('activeLane', index);
    });
    graphics.on('pointerout', () => graphics.alpha = 0.3);

    graphics.on('pointerup', () => {
        pubsub.publish('tryToFireAtInvaders', index);
    });

    layer.addChild(graphics);

    return graphics;

}

export default {

    init (pubsub) {

        const layer = getRenderLayer('lanes');
        const lanes = Array(NR_OF_LANES).fill(null).map((na, index) => createLane(layer, index, pubsub));
    
        // TEMP
        layer.y = -10;
        layer.x = 100;

        pubsub.subscribeOnce('gameReady', () => {
            pubsub.publish('activeLane', Math.floor(NR_OF_LANES * 0.5));
        });


    }

};