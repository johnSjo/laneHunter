
import * as PIXI from 'pixi.js';

export default {

    loadResources (assets) {
        return new Promise((resolve) => {

            const loader = new PIXI.loaders.Loader();

            loader.add(assets);

            loader.load();

            loader.once('complete', () => {
                resolve(loader.resources);
            });
        });
    }

};