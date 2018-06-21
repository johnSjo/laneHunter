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

function init (pubsub, resources) {
    const layer = getRenderLayer('ship');
    const ships = creatShips(resources, layer);

    // TEMP
    const currentShip = ships[Math.floor(Math.random() * 2)];

    layer.y = 800;

    currentShip.visible = true;

    pubsub.subscribe('activeLane', (index) => {
        TweenLite.to(currentShip, 0.35, { x: index * LANE_WIDTH });
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