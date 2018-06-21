import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';
import { getRenderLayer } from './renderer'
import loader from './assetsLoader'

const ALIEN_SIZE = 160

function addInvaders (layer, invaders, numberOfAliens, resources) {
    const alien = `alien${Math.floor(Math.random() * 4)}`;

    invaders.push(Array(numberOfAliens).fill(null).map((item, index) => {
        return createAlien(alien, resources, layer, index, invaders.length);
    }));

}

function createAlien (alien, resources, layer, col, row) {

    const sprite = new PIXI.Sprite(resources[alien].texture);

    sprite.anchor = new PIXI.Point(0.5, 0.5);
    sprite.scale = new PIXI.Point(5, 5);
    sprite.x = sprite.width * col * 1.1;
    sprite.y = sprite.height * row * -1.1;

    layer.addChild(sprite);

    return sprite;
}

function updateInvaders (invaders, data) {
    const waitFor = [];

    data.forEach((row, y) => {
        row.forEach((alien, x) => {
            const invader = invaders[y][x];

            if (alien.state !== 'alive' && invader) {
                waitFor.push(new Promise((resolve) => {
                    TweenLite.to(invader, 0.5, { alpha: 0, onComplete: () => {
                        invader.parent.removeChild(invader);
                        invaders[y][x] = null;
                        resolve();
                    } });
                }));
            }
        });
    });

    return Promise.all(waitFor);
}

function init (pubsub, resources) {
    const layer = getRenderLayer('invaders');
    const invaders = [];

    // TEMP
    layer.y = 100;
    layer.x = ALIEN_SIZE * 0.5;

    pubsub.subscribe('startRound', (data) => {
        const aliensPerRow = JSON.parse(data).invaders[0].length;

        addInvaders(layer, invaders, aliensPerRow, resources);
    });
    
    pubsub.subscribe('attackResponse', (data) => {
        const aliensPerRow = JSON.parse(data).invaders[0].length;
        
        updateInvaders(invaders, JSON.parse(data).invaders).
            then((() => {
                addInvaders(layer, invaders, aliensPerRow, resources);
                TweenLite.to(layer, 1, { y: '+=176' });
            }));
    });
}

export default {

    init (pubsub) {

        const assets = [
            { name: 'alien0', url: 'assets/enemy_1.png' },
            { name: 'alien1', url: 'assets/enemy_2.png' },
            { name: 'alien2', url: 'assets/enemy_3.png' },
            { name: 'alien3', url: 'assets/enemy_4.png' }
        ];

        return new Promise((resolve) => {
            loader.loadResources(assets).then((resources) => {
                init(pubsub, resources);
                resolve();
            });
        });
    }

};