import * as PIXI from 'pixi.js';
import { getRenderLayer } from './renderer'

const NR_OF_LANES = 3;
const ALIEN_SIZE = 160

function createLane (layer, index, pubsub) {
    const graphics = new PIXI.Graphics();

    graphics.beginFill(0xaaaaaa);

    graphics.lineStyle(10, 0xbbbbbb);

    graphics.drawRect(index * (ALIEN_SIZE * 1.1), 0, ALIEN_SIZE, 775);

    graphics.alpha = 0.3;
    graphics.interactive = true;

    graphics.on('pointerover', () => {
        graphics.alpha = 0.6;
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
        const background = new PIXI.Graphics();

        layer.y = 10;
        layer.x = 100;

        background.beginFill(0xddeeee);
    
        background.drawRect(-layer.x, -layer.y, 728, 1050);

        layer.addChildAt(background, 0);
    


        pubsub.subscribeOnce('gameReady', () => {
            pubsub.publish('activeLane', Math.floor(NR_OF_LANES * 0.5));
        });


    }

};