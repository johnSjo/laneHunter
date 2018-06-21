
import * as PIXI from 'pixi.js';

const CONTAINER_SELECTOR = '#game';
const BASE_WIDTH = 728;
const BASE_HEIGHT = 1050;

const LAYERS = [
    'lanes',
    'invaders',
    'ship',
    'winPresentation'
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

function reScale (container) {
    const xScale = container.offsetWidth / BASE_WIDTH;
    const yScale = container.offsetHeight / BASE_HEIGHT;

    const scale = Math.min(xScale, yScale);

    container.style.transform = `scale(${scale})`;
}

function initRenderer (stage, container) {

    const renderer = PIXI.autoDetectRenderer(BASE_WIDTH, BASE_HEIGHT, {
        transparent: true
    });

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    container.appendChild(renderer.view);

    window.addEventListener('resize', () => {
        reScale(container);
    });

    function render () {
        renderer.render(stage);
        requestAnimationFrame(render);
    }

    reScale(container);

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