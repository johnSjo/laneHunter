
import * as PIXI from 'pixi.js';

const CONTAINER_SELECTOR = '#game';
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

const LAYERS = [
    'lanes',
    'invaders',
    'ship'
];

const INTERACTIVE_LAYERS = [
    'lanes'
];

const renderLayers = {};

const stage = new PIXI.Container();

LAYERS.forEach((name) => {

    const layer = new PIXI.Container();

    renderLayers[name] = layer;
    layer.interactiveChildren = INTERACTIVE_LAYERS.includes(name);

    stage.addChild(layer);

});

function initRenderer (stage, container) {

    const renderer = PIXI.autoDetectRenderer(BASE_WIDTH, BASE_HEIGHT, {
        transparent: true
    });

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    container.appendChild(renderer.view);

    window.addEventListener('resize', () => {
        renderer.resize(container.offsetWidth, container.offsetHeight);
    });

    function render () {
        renderer.render(stage);
        requestAnimationFrame(render);
    }

    renderer.resize(container.offsetWidth, container.offsetHeight);

    render();

}

export function getRenderLayer (layer) {
    return renderLayers[layer];
}

export default {

    init () {

        const container = document.querySelector(CONTAINER_SELECTOR);

        initRenderer(stage, container);

    }

};