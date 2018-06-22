
import { Howl } from 'howler';

const baseURL = './assets/audio/';

function createFxHowls () {

    const explosions = Array(9).fill(null).map((na, index) => {
        return { 
            name: `explosion${index}`,
            url: `${baseURL}/explosions/explosion0${index + 1}.wav`
        }
    });

    explosions.forEach((sound) => {
        sound.howl = new Howl({ src: sound.url });
    });

    return explosions;

}

function createMusicHowl () {

    const config = { volume: 0.1 };

    return new Howl(Object.assign({}, config, {
        src: baseURL + 'Orbital Colossus.mp3',
        loop: true,
        autoplay: true,
        preload: false
    }));

}

function initFxHandlers (pubsub, fxHowls) {

    pubsub.subscribe('sound/explosion', () => {
        const soundToPlay = `explosion${Math.floor(Math.random() * 9)}`;

        fxHowls.find((sound) => sound.name === soundToPlay).howl.play();
    });

}

export default {
    init (pubsub) {

        const musicHowl = createMusicHowl();
        const fxHowls = createFxHowls();
    
        initFxHandlers(pubsub, fxHowls);

        pubsub.subscribeOnce('gameReady', () => {
            musicHowl.load();

            fxHowls.forEach((sound) => {
                sound.howl.load();
            });
        });
    
    }
};
