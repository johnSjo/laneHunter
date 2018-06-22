
import { Howl } from 'howler';

const baseURL = './assets/audio/';

function createFxHowls () {

    const sounds = Array(9).fill(null).map((na, index) => {
        return { 
            name: `explosion${index}`,
            url: `${baseURL}/explosions/explosion0${index + 1}.wav`,
            config: { volume: 0.3, rate: 2 }
        }
    });

    sounds.push({
        name: 'weapon0',
        url: `${baseURL}/fx/quaddamage_shoot.ogg`,
        config: { volume: 0.05, rate: 2 }
    })

    sounds.forEach((sound) => {
        const config = sound.config || {};

        sound.howl = new Howl(Object.assign({}, config, { src: sound.url }));
    });

    return sounds;

}

function createMusicHowl () {

    const config = { volume: 0.05 };

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

    pubsub.subscribe('sound/weapon', () => {
        fxHowls.find((sound) => sound.name === 'weapon0').howl.play();
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
