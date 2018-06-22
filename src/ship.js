import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';
import { getRenderLayer } from './renderer'
import loader from './assetsLoader'

const LANE_WIDTH = 176;

const BET_LEVELS = [10, 20, 50, 100, 200, 500, 1000, 5000];

const SHIP_COLORS = ['0xffcf40', '0xffbf00', '0xbf9b30', '0xa67c00'];

function creatShips (resources, layer) {

    return Array(2).fill(null).map((na, index) => {
        const sprite = new PIXI.Sprite(resources[`ship${index}`].texture);
    
        sprite.scale = new PIXI.Point(5, 5);
        sprite.visible = false;
        sprite.tint = SHIP_COLORS[0];
        sprite.orgTint = SHIP_COLORS[0];
        sprite.y = 800;
        sprite.fireAnimation = makeFireAnimation(index, sprite);
    
        layer.addChild(sprite);
    
        return sprite;
    });
}

function makeFireAnimation (type, sprite) {
    let positions;
    let beams;

    switch (type) {
        case 0:
            positions = [{ x: 3, y: -8 }, { x: 9, y: -5 }, { x: 22, y: -5 }, { x: 28, y: -8 }];
            beams = positions.map((pos) => {
                const graphics = new PIXI.Graphics();

                graphics.beginFill(0xffeeee);
                graphics.lineStyle(2, 0xff0000);
                graphics.drawRect(pos.x, pos.y, 1, 40);
                graphics.blendMode = PIXI.BLEND_MODES.ADD;
                graphics.scale.y = -1;
                graphics.visible = false;

                sprite.addChild(graphics);

                return graphics;
            });
            break;
        case 1:
            positions = [{ x: 6, y: -5 }, { x: 23, y: -5 }];
            beams = positions.map((pos) => {
                const graphics = new PIXI.Graphics();

                graphics.beginFill(0xffeeee);
                graphics.lineStyle(2.5, 0xff0000);
                graphics.drawRect(pos.x, pos.y, 3, 40);
                graphics.blendMode = PIXI.BLEND_MODES.ADD;
                graphics.scale.y = -1;
                graphics.visible = false;

                sprite.addChild(graphics);

                return graphics;
            });
            break;
    }

    return () => {
        beams.forEach((beam) => {
            const time = 0.3;

            beam.visible = true;
            beam.y = 0;

            TweenLite.to(beam, time, { y: `-=200` });
            TweenLite.fromTo(beam, time * 0.5, { height: 0 }, { height: `+=100` });
            TweenLite.to(beam, time * 0.5, { height: 0, delay: time * 0.5, onComplete: () => {
                beam.visible = false;
            }});

        });
    };
}

// TODO: move into a util if same logic is needed elsewhere
function setupShipToggle ({ firing, moving}, pubsub, ships) {
    pubsub.subscribe('holdShip/fire', (instigator) => {
        if(!firing.includes(instigator)) {
            firing.push(instigator);

            if (firing.length === 1) {
                ships.forEach((ship) => (ship.tint = '0xff7777'));
            }
        }
    });
    
    pubsub.subscribe('holdShip/move', (instigator) => {
        if(!moving.includes(instigator)) {
            moving.push(instigator);
        }
    });
    
    pubsub.subscribe('releaseShip/fire', (instigator) => {
        const index = firing.indexOf(instigator);
        
        if (index > -1) {
            firing.splice(index, 1);
            
            if (firing.length === 0) {
                ships.forEach((ship) => (ship.tint = ship.orgTint));
            }
        }
    });
    pubsub.subscribe('releaseShip/move', (instigator) => {
        const index = moving.indexOf(instigator);

        if (index > -1) {
            moving.splice(index, 1);
        }
    });
}

function moveShip (canMove, currentShip, toLane, pubsub) {
    const newPos = toLane * LANE_WIDTH + 100;

    return new Promise((resolve) => {
        if (canMove() && currentShip.x !== newPos) {
            pubsub.publish('holdShip/fire', 'shipMoving');
    
            TweenLite.to(currentShip, 0.35, {
                x: newPos,
                onComplete: () => {
                    pubsub.publish('releaseShip/fire', 'shipMoving');
                    resolve();
                } 
            });
        } else {
            resolve();
        }
    });
}

function fireShip (canFire, pubsub, index, fireAnimation) {
    if (canFire()) {
        fireAnimation();
        pubsub.publish('fireAtInvaders', index);
    }
}

function init (pubsub, resources) {
    const layer = getRenderLayer('ship');
    const ships = creatShips(resources, layer);
    const hold = {
        firing: [],
        moving: []
    };
    const canMove = () => hold.moving.length === 0;
    const canFire = () => hold.firing.length === 0;
    let currentShip = ships[0];

    currentShip.visible = true;

    setupShipToggle(hold, pubsub, ships);

    pubsub.subscribe('activeLane', (index) => {
        moveShip(canMove, currentShip, index, pubsub);
        
    });

    pubsub.subscribe('tryToFireAtInvaders', (index) => {

        // if not in correct position -> move and fire
        const inPosition = currentShip.x === (index * LANE_WIDTH + 100);

        if (!inPosition) {
            moveShip(canMove, currentShip, index, pubsub).then(() => {
                fireShip(canFire, pubsub, index, currentShip.fireAnimation);
            });
        } else {
            fireShip(canFire, pubsub, index, currentShip.fireAnimation);
        }

    });

    pubsub.subscribe('updateBetLevel', (betLevel) => {
        const index = BET_LEVELS.indexOf(betLevel);
        const shipIndex = Math.floor(index / BET_LEVELS.length * ships.length);

        TweenLite.to(currentShip, 0.5, { y: 1100, onComplete: () => {
            const xPos = currentShip.x;

            currentShip.visible = false;
            
            currentShip = ships[shipIndex];
            currentShip.orgTint = SHIP_COLORS[index - shipIndex * SHIP_COLORS.length];
            
            currentShip.visible = true;
            currentShip.tint = currentShip.orgTint;
            currentShip.x = xPos;

            TweenLite.fromTo(currentShip, 0.5, { y: 1100 }, { y: 800 });

        } });


    });

}

export default {

    init (pubsub) {

        const assets = [
            { name: 'ship0', url: 'assets/player_ship.png' },
            { name: 'ship1', url: 'assets/player_ship2.png' }
        ];

        return new Promise((resolve) => {
            loader.loadResources(assets).then((resources) => {
                init(pubsub, resources);
                resolve();
            });
        });
    }

};