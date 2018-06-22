import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';
import { getRenderLayer } from './renderer'
import loader from './assetsLoader'

const LANE_WIDTH = 176;

const BET_LEVELS = [10, 20, 50, 100, 200, 500, 1000, 5000];

const SHIP_COLORS = ['0xffcf40', '0xffbf00', '0xbf9b30', '0xa67c00'];

const SHIPS = ['ship0', 'ship1'];

function creatShips (resources, layer) {

    return Array(2).fill(null).map((na, index) => {
        const sprite = new PIXI.Sprite(resources[`ship${index}`].texture);
    
        sprite.scale = new PIXI.Point(5, 5);
        sprite.visible = false;
        sprite.tint = SHIP_COLORS[0];
        sprite.orgTint = SHIP_COLORS[0];
        sprite.y = 800;
    
        layer.addChild(sprite);
    
        return sprite;
    });
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

function fireShip (canFire, pubsub, index) {
    if (canFire()) {
        pubsub.publish('holdShip/move', 'shipFiring');
        // play firing animation
        // when done -> ship can move again
        pubsub.publish('fireAtInvaders', index);

        pubsub.publish('releaseShip/move', 'shipFiring');
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
    let currentShip = ships[Math.floor(Math.random() * 2)];

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
                fireShip(canFire, pubsub, index);
            });
        } else {
            fireShip(canFire, pubsub, index);
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