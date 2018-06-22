import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';
import { getRenderLayer } from './renderer'

const BET_LEVELS = [10, 20, 50, 100, 200, 500, 1000, 5000];

function createBetSelector (layer, pubsub) {
    const backplate = new PIXI.Graphics();

    backplate.beginFill(0x000000);
    backplate.drawRect(0, 0, 728, 1050);
    backplate.alpha = 0.5;
    backplate.interactive = true;

    layer.addChild(backplate);

    const bets = [];

    BET_LEVELS.forEach((bet, index) => {

        const betText = new PIXI.Text(bet, {
            fontFamily: 'PressStart2P',
            fill: ['#ef2f22', '#de1f11'],
            fontSize: 60,
            align: 'center',
            lineJoin: 'miter',
            fontWeight: 'bold',
            stroke: '#580903',
            strokeThickness: 9,
            dropShadow: true,
            dropShadowAngle: Math.PI * 0.4,
            dropShadowColor: '#292121',
            dropShadowDistance: 7.5
        });

        betText.anchor = new PIXI.Point(1, 0.5);
        betText.rotation = -0.1;
        betText.x = 710;
        betText.y = 700 - index * betText.height * 1.1 + 1100;
        betText.interactive = true;

        betText.on('pointerup', () => {
            pubsub.publish('updateBetLevel', bet);
            betText.blendMode = PIXI.BLEND_MODES.NORMAL;
            betText.scale = { x: 1, y: 1 };
        });

        betText.on('pointerupoutside', () => {
            betText.blendMode = PIXI.BLEND_MODES.NORMAL;
            betText.scale = { x: 1, y: 1 };
        });

        betText.on('pointerover', () => {
            betText.blendMode = PIXI.BLEND_MODES.ADD;
            betText.scale = { x: 1.1, y: 1.1 };
        });
        
        betText.on('pointerdown', () => {
            betText.blendMode = PIXI.BLEND_MODES.MULTIPLY;
            betText.scale = { x: 0.9, y: 0.9 };
        });
        
        betText.on('pointerout', () => {
            betText.blendMode = PIXI.BLEND_MODES.NORMAL;
            betText.scale = { x: 1, y: 1 };
        });

        bets.push(betText);
    
        layer.addChild(betText);
    });

    return { bets, backplate };
}

function createPlayButton (layer, pubsub) {
    const playButton = new PIXI.Text('Play', {
        fontFamily: 'PressStart2P',
        fill: ['#ef2f22', '#de1f11'],
        fontSize: 100,
        align: 'center',
        lineJoin: 'miter',
        fontWeight: 'bold',
        stroke: '#580903',
        strokeThickness: 12,
        dropShadow: true,
        dropShadowAngle: Math.PI * 0.4,
        dropShadowColor: '#292121',
        dropShadowDistance: 10
    });

    playButton.anchor = new PIXI.Point(0.5, 0.5);
    playButton.x = 728 / 2 - 800;
    playButton.y = 650;
    playButton.interactive = true;

    playButton.on('pointerup', () => {
    });
    
    playButton.on('pointerup', () => {
        pubsub.publish('tryToStartNewRound');
        TweenLite.to(playButton, 0.5, { x: '-=800' });
        playButton.blendMode = PIXI.BLEND_MODES.NORMAL;
        playButton.scale = { x: 1, y: 1 };
    });

    playButton.on('pointerover', () => {
        playButton.blendMode = PIXI.BLEND_MODES.ADD;
        playButton.scale = { x: 1.1, y: 1.1 };
    });
    
    playButton.on('pointerdown', () => {
        playButton.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        playButton.scale = { x: 0.9, y: 0.9 };
    });
    
    playButton.on('pointerout', () => {
        playButton.blendMode = PIXI.BLEND_MODES.NORMAL;
        playButton.scale = { x: 1, y: 1 };
    });


    layer.addChild(playButton);

    return playButton;
}

function createStatusBar (pubsub) {
    const layer = getRenderLayer('statusBar');
    const style = {
        fontFamily: 'PressStart2P',
        fill: ['#ef2f22', '#de1f11'],
        fontSize: 20,
        align: 'center',
        lineJoin: 'miter',
        fontWeight: 'bold',
        stroke: '#580903',
        strokeThickness: 3,
        dropShadow: true,
        dropShadowAngle: Math.PI * 0.4,
        dropShadowColor: '#292121',
        dropShadowDistance: 2.5
    };
    const numbersStyle = {
        ...style,
        fill: ['0xffcf40', '0xffbf00', '0xbf9b30'],
        fontSize: 25,
        stroke: '0xa67c00',
        dropShadow: false
    };
    const balance = new PIXI.Text('Balance:', style);
    const betLevel = new PIXI.Text('Bet:', style);
    const balanceValue = new PIXI.Text('50000', numbersStyle);
    const betValue = new PIXI.Text('100', numbersStyle);

    const anchor = new PIXI.Point(0, 0.5);

    layer.y = 1020;
    balance.x = 40;
    balance.anchor = anchor;
    betLevel.x = 500;
    betLevel.anchor = anchor;
    balanceValue.x = balance.x + balance.width;
    balanceValue.anchor = anchor;
    betValue.x = betLevel.x + betLevel.width;
    betValue.anchor = anchor;

    pubsub.subscribe('updateBetLevel', (bet) => {
        betValue.text = bet;
    });

    pubsub.subscribe('attackResponse', (data) => {
        const { balance } = JSON.parse(data);

        balanceValue.text = balance;
    });

    layer.addChild(balance, betLevel, balanceValue, betValue);
}

export default {

    init (pubsub) {

        const layer = getRenderLayer('ui');

        const { bets, backplate } = createBetSelector(layer, pubsub);
        const playButton = createPlayButton(layer, pubsub);
        
        createStatusBar(pubsub);

        pubsub.subscribe('showPlayMenu', () => {
            layer.visible = true;

            TweenLite.fromTo(backplate, 0.5, { alpha: 0 }, { alpha: 0.5 });
            bets.forEach((bet, index) => {
                TweenLite.to(bet, 0.45, { y: '-=1100', delay: index * 0.05 });
            });

            TweenLite.to(playButton, 0.5, { x: '+=800' });
        });

        pubsub.subscribe('tryToStartNewRound', () => {
            bets.forEach((bet, index) => {
                TweenLite.to(bet, 0.45, { y: '+=1100', delay: index * 0.05 });
            });

            TweenLite.to(backplate, 1, { alpha: 0, onComplete: () => {
                layer.visible = false;
            } });
        });

    }

};