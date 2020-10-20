import * as Bacon from 'baconjs';
import * as Hammer from 'hammerjs';
import Color = require('color');
import { Dimension } from 'netherlink/dimension';
import { parseHTML } from 'netherlink/parse-html';
import { Point } from 'netherlink/point';
import { WorldEditorModel } from '../model/world-editor';
import htmlAtlas from './atlas.html';

export class AtlasView<D extends Dimension> {
    private readonly dimension: D;
    private readonly model: WorldEditorModel;

    /* The center of the atlas in the world coords. */
    private readonly center: Bacon.Observable<Point>;

    /* How the world coords are scaled to the local coords,
     * i.e. pixels. */
    private readonly scale: Bacon.Observable<number>;

    private readonly pane: DocumentFragment;
    private readonly canvas: HTMLCanvasElement;
    private readonly fldScale: HTMLInputElement;

    public constructor(dimension: D, model: WorldEditorModel) {
        this.dimension = dimension;
        this.model     = model;

        this.center = model.currentCoords(dimension);
        this.scale = model.atlasScale(dimension);

        this.pane = parseHTML(htmlAtlas);

        /* Canvases don't resize themselves. Whenever the window size
         * changes, we need to resize them based on the size of their
         * parent. The owner of this view is expected to trigger the
         * resize event after attaching it to DOM. */
        this.canvas = this.pane.querySelector("canvas")! as HTMLCanvasElement;

        /* But since resizing and redrawing canvases is quite
         * expensive, we need to throttle the events. */
        const throttleMilliSec = 10;
        const windowResized = Bacon.fromEvent(window, 'resize').throttle(throttleMilliSec);

        /* The content of the atlas is determined by the center,
         * scale, and size. Redraw it whenever either of them
         * changes..
         */
        Bacon.combineAsArray(this.center, this.scale as any, windowResized as any)
            .onValue(([c, sc, ev]: any) => {
                this.resize();
                this.redraw(c, sc);
            });

        /* The scale slider should be synchronized with the scale
         * property. */
        this.fldScale = this.pane.querySelector("input.atlas-scale")! as HTMLInputElement;
        this.scale.onValue(s => {
            this.fldScale.value = String(s);
        });
        this.fldScale.addEventListener('input', ev => {
            this.model.atlasScale(dimension, Number(this.fldScale.value));
        });

        /* Configurations for mouse and touch devices.
         */
        const hm = new Hammer.Manager(this.canvas, {
            domEvents: true,
            recognizers: [
                [Hammer.Pan],
                [Hammer.Pinch]
            ]
        });

        /* Users can pinch or use their mouse wheel to change the scale. */
        const preventDefault: any = (ev: Event) => ev.preventDefault();
        const wheelRotated = Bacon.fromEvent(this.canvas, 'wheel')
            .doAction(preventDefault)
            .debounceImmediate(10);
        Bacon.combineAsArray(
            wheelRotated,
            this.scale.sampledBy(wheelRotated) as any)
            .map(([ev, s0]: any) => {
                const min  = Number(this.fldScale.min);
                const max  = Number(this.fldScale.max);
                const step = Number(this.fldScale.step);
                if ((<WheelEvent>ev).deltaY > 0) {
                    return Math.min(s0 + step, max);
                }
                else {
                    return Math.max(s0 - step, min);
                }
            })
            .onValue(s => this.model.atlasScale(dimension, s));

        const pinchStart  = Bacon.fromEvent(this.canvas, "pinchstart").doAction(preventDefault);
        const pinchMove   = Bacon.fromEvent(this.canvas, "pinch").doAction(preventDefault).debounceImmediate(20);
        const pinchEnd    = Bacon.fromEvent(this.canvas, "pinchend").doAction(preventDefault);
        const pinchCancel = Bacon.fromEvent(this.canvas, "pinchcancel").doAction(preventDefault);
        const pinch       = pinchStart.merge(pinchMove).merge(pinchEnd).merge(pinchCancel);
        Bacon.combineAsArray(
            pinch,
            this.scale.sampledBy(pinch))
            .withStateMachine(null, ((s0: number|null, ev: Bacon.Event<any>) => {
                if (ev.hasValue) {
                    const [domEvent, s]: [Event, number] = (<any>ev).value;
                    const hmEvent = (<any>domEvent).gesture;
                    switch (domEvent.type) {
                        case "pinchstart":
                            return [s, []];

                        case "pinch":
                            if (s0) {
                                const min  = Number(this.fldScale.min);
                                const max  = Number(this.fldScale.max);
                                const step = Number(this.fldScale.step);
                                const ds   = hmEvent.scale;
                                const s1   = s0 * ds;
                                const s1q  = Math.round(s1 * (1/step)) / (1/step); // quantized
                                const s1qr = Math.min(Math.max(s1q, min), max); // restricted
                                return [s0, [new Bacon.Next(s1qr)]];
                            }
                    }
                }
                return [null, []];
            }) as any)
            .onValue(((s: number) => this.model.atlasScale(dimension, s)) as any);

        /* Users can drag the atlas to scroll it. */
        const panStart  = Bacon.fromEvent(this.canvas, "panstart").doAction(preventDefault);
        const panMove   = Bacon.fromEvent(this.canvas, "pan").doAction(preventDefault).debounceImmediate(10);
        const panEnd    = Bacon.fromEvent(this.canvas, "panend").doAction(preventDefault);
        const panCancel = Bacon.fromEvent(this.canvas, "pancancel").doAction(preventDefault);
        const pan       = panStart.merge(panMove).merge(panEnd).merge(panCancel);
        Bacon.combineAsArray(
            pan,
            this.center.sampledBy(pan) as any,
            this.scale.sampledBy(pan) as any)
            .withStateMachine(null, ((c0: Point|null, ev: Bacon.Event<any>) => {
                if (ev.hasValue) {
                    const [domEvent, c, scale]: [Event, Point, number] = (<any>ev).value;
                    const hmEvent = (<any>domEvent).gesture;
                    switch (domEvent.type) {
                        case "panstart":
                            return [c, []];

                        case "pan":
                            if (c0) {
                                const dx = -hmEvent.deltaX / scale;
                                const dz = -hmEvent.deltaY / scale;
                                const c1 = c0.offset(dx, 0, dz).round();
                                return [c0, [new Bacon.Next(c1)]];
                            }
                    }
                }
                return [null, []];
            }) as any)
            .onValue(((c: Point) => {
                this.model.currentCoords(dimension, c);
            }) as any);
    }

    public get fragment(): DocumentFragment {
        return this.pane;
    }

    private resize() {
        const parent = this.canvas.parentElement;
        if (parent) {
            this.canvas.width  = parent.clientWidth;
            this.canvas.height = parent.clientHeight;

            /* And recalculate the height of the scale slider. I know
             * this should be done solely in the style sheet but I
             * can't find a way to do it. I'm a CSS noob. */
            this.fldScale.style.setProperty(
                'height', Math.floor(this.canvas.height * (2/10)) + 'px');
        }
    }

    private bgColor(): string {
        // Maybe we should cache this?
        const styles = window.getComputedStyle(this.canvas);
        const color  = styles.getPropertyValue("background-color");
        return color ? color : 'rgba(0, 0, 0, 0)';
    }

    private redraw(center: Point, scale: number): void {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            /* First we need to clear the entire canvas. */
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = this.bgColor();
            ctx.fill();
        }
    }
}
