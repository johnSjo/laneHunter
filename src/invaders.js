import * as PIXI from 'pixi.js';
import loader from './assetsLoader'
import { getRenderLayer } from './renderer'
import { TweenLite } from 'gsap';
import showWin from './winPresentation';

const ALIEN_SIZE = 160

const ALIEN_TINT = [
    '0xFFFF00',
    '0xFF00FF',
    '0x00FFFF',
    '0xAAFF00',
    '0xFFAA00',
    '0xFF00AA',
]

function addInvaders (layer, invaders, numberOfAliens, resources) {
    const alien = `alien${Math.floor(Math.random() * 4)}`;
    const tint = ALIEN_TINT[Math.floor(Math.random() * ALIEN_TINT.length)];

    invaders.push(Array(numberOfAliens).fill(null).map((item, index) => {
        return createAlien(alien, resources, layer, index, invaders.length, tint);
    }));

}

function createAlien (alien, resources, layer, col, row, tint) {

    const sprite = new PIXI.Sprite(resources[alien].texture);

    sprite.anchor = new PIXI.Point(0.5, 0.5);
    sprite.scale = new PIXI.Point(5, 5);
    sprite.x = sprite.width * col * 1.1;
    sprite.y = sprite.height * row * -1.1;
    sprite.tint = tint;

    layer.addChild(sprite);

    return sprite;
}

function updateInvaders (invaders, data) {
    const waitFor = [];

    Object.entries(data).forEach(([key, aliens]) => {
        const delay = key * 0.25;

        aliens.forEach((alien) => {
            const { row, col } = alien.pos;
            const invader = invaders[row][col];
            
            if (alien.win > 0) {
                waitFor.push(showWin(invader, alien.win, delay));
            }

            waitFor.push(new Promise((resolve) => {
                TweenLite.to(invader, 0.5, {
                    alpha: 0,
                    delay,
                    onComplete: () => {
                        invader.parent.removeChild(invader);
                        invaders[row][col] = null;
                        resolve();
                    }
                });
            }));
        });
    });

    return Promise.all(waitFor);
}

function init (pubsub, resources) {
    const layer = getRenderLayer('invaders');
    const invaders = [];
    let aliensPerRow;

    // TEMP
    layer.y = 100;
    layer.x = ALIEN_SIZE * 0.5 + 100;

    pubsub.subscribe('startRound', (data) => {
        aliensPerRow = JSON.parse(data).aliensPerRow;

        addInvaders(layer, invaders, aliensPerRow, resources);
    });
    
    pubsub.subscribe('attackResponse', (data) => {
        
        updateInvaders(invaders, JSON.parse(data).invaders).
            then((() => {
                addInvaders(layer, invaders, aliensPerRow, resources);
                TweenLite.to(layer, 1, { y: '+=176', onComplete: () => {
                    // attack over
                    pubsub.publish('releaseShip/fire', 'attacking');
                } });
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