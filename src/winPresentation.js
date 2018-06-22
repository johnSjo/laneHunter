import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';
import { getRenderLayer } from './renderer'

export default function showWin (invader, winValue, delay) {
    const layer = getRenderLayer('winPresentation');
    const win = new PIXI.Text(winValue, {
        fontFamily: 'PressStart2P',
        fill: ['#ef2f22', '#de1f11'],
        fontSize: 80,
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

    layer.addChild(win);

    const position = invader.getGlobalPosition();

    win.x = position.x;
    win.y = position.y;
    win.anchor = new PIXI.Point(0.5, 0.5);
    win.alpha = 0;
    win.rotation = -0.1;

    win.width = Math.min(win.width, 190);

    return new Promise((resolve) => {
        TweenLite.to(win, 1.5, {
            alpha: 1,
            delay: delay + 0.25,
            onComplete: () => {
                win.parent.removeChild(win);
                resolve();
            }
        });
    });

}
