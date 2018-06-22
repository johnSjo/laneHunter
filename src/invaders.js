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

function makeExplosion (textures, invader, big, pubsub) {
    const layer = invader.parent;
    const explosion = new PIXI.extras.AnimatedSprite(textures[0]);

    explosion.loop = false;
    explosion.anchor = new PIXI.Point(0.5, 0.5);
    explosion.x = invader.x;
    explosion.y = invader.y;
    explosion.animationSpeed = 0.25;
    explosion.rotation = Math.random();
    explosion.onComplete = () => layer.removeChild(explosion);
    explosion.play();

    pubsub.publish('sound/explosion');

    layer.addChild(explosion);

    if (big) {
        const nr = Math.floor(Math.random() * 3 + 1);

        Array(nr).fill(null).map(() => {
            const exp = new PIXI.extras.AnimatedSprite(textures[Math.floor(Math.random() * 2 + 1)]);

            exp.loop = false;
            exp.anchor = new PIXI.Point(0.5, 0.5);
            exp.x = invader.x + invader.width * Math.random() - invader.width * 0.5;
            exp.y = invader.y + invader.height * Math.random() - invader.height * 0.5;
            exp.animationSpeed = 0.25;
            exp.rotation = Math.random();
            exp.visible = false;
            exp.onComplete = () => layer.removeChild(exp);
            TweenLite.delayedCall(Math.random() * 0.3, () => {
                exp.visible = true;
                exp.play();
                pubsub.publish('sound/explosion');
            });

            layer.addChild(exp);
        });
    }
}

function blowUpThePlayer (layer, textures, pubsub) {
    Array(10).fill(null).forEach((na, index) => {
        const fakeInvader = {
            parent: layer,
            x: Math.random() * 530 - 80,
            y: -layer.y + 850,
            width: 160,
            height: 160
        }

        TweenLite.delayedCall(Math.random() * index * 0.2, () => {
            makeExplosion(textures, fakeInvader, true, pubsub);
        });
    });
}

function updateInvaders (invaders, data, explosionTextures, pubsub) {
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
                    onStart: () => {
                        switch (alien.state) {
                            case 'killed':
                                makeExplosion(explosionTextures, invader, false, pubsub);
                                break;
                            case 'exploded':
                                makeExplosion(explosionTextures, invader, true, pubsub);
                                break;
                        }
                    },
                    onComplete: () => {
                        invader.parent.removeChild(invader, invader.explosion);
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
    const explosionTextures = Array(3).fill(null).map((na, index) => {
        return Array(13).fill(null).map((na, frame) => {
            const frameSize = {
                height: resources[`explosion${index}`].texture.height,
                width: resources[`explosion${index}`].texture.width / 13
            };

            return new PIXI.Texture(resources[`explosion${index}`].texture, new PIXI.Rectangle(
                frame * frameSize.width, 0, frameSize.width, frameSize.height
            ));
        });
    });
    let aliensPerRow;

    // TEMP
    layer.x = ALIEN_SIZE * 0.5 + 100;

    pubsub.subscribe('startRound', (data) => {
        aliensPerRow = JSON.parse(data).aliensPerRow;
        invaders.forEach((row) => {
            row.forEach((alien) => {
                if (alien) {
                    alien.parent.removeChild(alien);
                }
            });
        });
        invaders.length = 0;

        addInvaders(layer, invaders, aliensPerRow, resources);
        TweenLite.fromTo(layer, 1, { y: -100 }, { y: '+=200' });
    });
    
    pubsub.subscribe('attackResponse', (data) => {
        const response = JSON.parse(data);
        const { state } = response;
        const killedAliens = response.invaders;

        updateInvaders(invaders, killedAliens, explosionTextures, pubsub).
            then((() => {
                addInvaders(layer, invaders, aliensPerRow, resources);
                TweenLite.to(layer, 1, { y: '+=176', onComplete: () => {
                    // attack over
                    pubsub.publish('releaseShip/fire', 'attacking');
                    
                    if (state === 'finalAttackLose') {
                        blowUpThePlayer(layer, explosionTextures, pubsub);
                        pubsub.publish('showPlayMenu');
                    }
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
            { name: 'alien3', url: 'assets/enemy_4.png' },
            { name: 'explosion0', url: 'assets/explosion_01_strip13.png' },
            { name: 'explosion1', url: 'assets/explosion_02_strip13.png' },
            { name: 'explosion2', url: 'assets/explosion_03_strip13.png' }
        ];

        return new Promise((resolve) => {
            loader.loadResources(assets).then((resources) => {
                init(pubsub, resources);
                resolve();
            });
        });
    }

};