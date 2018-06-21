import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';
import { getRenderLayer } from './renderer'
import loader from './assetsLoader'

const LANE_WIDTH = 176;

function creatShips (resources, layer) {

    return Array(2).fill(null).map((na, index) => {
        const sprite = new PIXI.Sprite(resources[`ship${index}`].texture);
    
        sprite.scale = new PIXI.Point(5, 5);
        sprite.visible = false;
    
        layer.addChild(sprite);
    
        return sprite;
    });
}

// TODO: move into a util if same logic is needed elsewhere
function setupShipToggle ({ firing, moving}, pubsub, ship) {
    pubsub.subscribe('holdShip/fire', (instigator) => {
        if(!firing.includes(instigator)) {
            firing.push(instigator);

            if (firing.length === 1) {
                ship.tint = '0xff7777';
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
                ship.tint = '0xbbffbb';
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

function init (pubsub, resources) {
    const layer = getRenderLayer('ship');
    const ships = creatShips(resources, layer);
    const hold = {
        firing: [],
        moving: []
    };
    const canMove = () => hold.moving.length === 0;
    const canFire = () => hold.firing.length === 0;

    // TEMP
    const currentShip = ships[Math.floor(Math.random() * 2)];

    layer.y = 800;

    currentShip.visible = true;

    setupShipToggle(hold, pubsub, currentShip);

    pubsub.subscribe('activeLane', (index) => {
        const newPos = index * LANE_WIDTH + 100;

        if (canMove() && currentShip.x !== newPos) {
            pubsub.publish('holdShip/fire', 'shipMoving');

            TweenLite.to(currentShip, 0.35, {
                x: newPos,
                onComplete: () => {
                    pubsub.publish('releaseShip/fire', 'shipMoving');
                } 
            });
        }
    });

    pubsub.subscribe('tryToFireAtInvaders', (index) => {

        if (canFire()) {
            pubsub.publish('holdShip/move', 'shipFiring');
            // play firing animation
            // when done -> ship can move again
            pubsub.publish('fireAtInvaders', index);

            pubsub.publish('releaseShip/move', 'shipFiring');
        }

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