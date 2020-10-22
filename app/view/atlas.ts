import * as Bacon from 'baconjs';
import * as Hammer from 'hammerjs';
import Color = require('color');
import { Chunk } from 'netherlink/chunk';
import { Dimension } from 'netherlink/dimension';
import { parseHTML } from 'netherlink/parse-html';
import { Point, Point2D } from 'netherlink/point';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
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
         * scale, world, selected portals on both sides, and
         * size. Redraw it whenever any of them changes.
         */
        Bacon.combineAsArray(
            this.center,
            this.scale as any,
            model.world as any,
            windowResized as any)
            .onValue(([c, sc, w, ev]: any) => {
                this.resize();
                this.redraw(c, sc, w);
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
            if (this.canvas.width  != parent.clientWidth ||
                this.canvas.height != parent.clientHeight) {

                this.canvas.width  = parent.clientWidth;
                this.canvas.height = parent.clientHeight;

                /* And recalculate the height of the scale slider. I
                 * know this should be done solely in the style sheet
                 * but I can't find a way to do it. I'm a CSS noob. */
                this.fldScale.style.setProperty(
                    'height', Math.floor(this.canvas.height * (2/10)) + 'px');
            }
        }
    }

    private bgColor(): string {
        // Maybe we should cache this?
        const styles = window.getComputedStyle(this.canvas);
        const color  = styles.getPropertyValue("background-color");
        return color ? color : 'rgba(0, 0, 0, 0)';
    }

    private redraw(center: Point, scale: number, world: World): void {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            /* The center of the atlas should be at center of a block,
             * not on a border. */
            center = center.offset(0.5, 0, 0.5);

            /* First we need to clear the entire canvas. */
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = this.bgColor();
            ctx.fill();

            /* For each chunk visible from the atlas we draw a rectangle
             * for it.
             */
            const topLeft = new Point2D(
                center.x - (this.canvas.width  / 2) / scale,
                center.z - (this.canvas.height / 2) / scale);
            const bottomRight = new Point2D(
                topLeft.x + this.canvas.width  / scale,
                topLeft.z + this.canvas.height / scale);

            /* A chunk is visible if any of its four corners is
             * visible. */
            function isPointVisible(p: Point): boolean;
            function isPointVisible(p: Point2D): boolean;
            function isPointVisible(p: any): boolean {
                return p.x >= topLeft.x     && p.z >= topLeft.z
                    && p.x <  bottomRight.x && p.z <  bottomRight.z;
            }
            function isChunkVisible(c: Chunk): boolean {
                return isPointVisible(c.origin)
                    || isPointVisible(c.offset(1, 0).origin)
                    || isPointVisible(c.offset(0, 1).origin)
                    || isPointVisible(c.offset(1, 1).origin);
            }
            function worldToAtlas(p: Point): Point2D;
            function worldToAtlas(p: Point2D): Point2D;
            function worldToAtlas(p: any): Point2D {
                return new Point2D(
                    (p.x - topLeft.x) * scale,
                    (p.z - topLeft.z) * scale);
            }
            ctx.strokeStyle = 'rgba(0, 0, 0, 5%)';
            ctx.lineWidth   = 1.0;
            for (let c = new Chunk(topLeft); isChunkVisible(c); c = c.offset(1, 0)) {
                for (let d = c; isChunkVisible(d); d = d.offset(0, 1)) {
                    const origin = worldToAtlas(d.origin);
                    ctx.strokeRect(
                        Math.floor(origin.x), Math.floor(origin.z),
                        16 * scale, 16 * scale);
                }
            }

            /* Plot portals in this dimension if they are visible. */
            const portalPointRadius = 4; // px
            const portalPointWidth  = 1; // px
            function isPortalVisible(p: Point): boolean {
                return isPointVisible(
                    p.offset(
                        -portalPointRadius/2 - portalPointWidth, 0,
                        -portalPointRadius/2 - portalPointWidth)) ||
                    isPointVisible(
                        p.offset(
                            portalPointRadius/2 + portalPointWidth, 0,
                            portalPointRadius/2 + portalPointWidth));
            }
            ctx.lineWidth = portalPointWidth;
            for (const portal of world.portals(this.dimension)) {
                const portalCenter = portal.location.offset(0.5, 0, 0.5);
                if (isPortalVisible(portalCenter)) {
                    const centerA = worldToAtlas(portalCenter);
                    ctx.strokeStyle = portal.color.string();
                    ctx.fillStyle   = ctx.strokeStyle;
                    ctx.beginPath();
                    ctx.arc(
                        Math.floor(centerA.x), Math.floor(centerA.z),
                        portalPointRadius, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fill();
                }
            }

            /* Draw a cross-hair at the center of atlas. */
            const pointerRadius = 10; // px
            const atlasCenter   = worldToAtlas(center);
            ctx.strokeStyle = 'rgba(0, 0, 0, 80%)';
            ctx.lineWidth   = 1.0;

            ctx.beginPath();
            ctx.moveTo(atlasCenter.x - pointerRadius/2, atlasCenter.z);
            ctx.lineTo(atlasCenter.x + pointerRadius/2, atlasCenter.z);

            ctx.moveTo(atlasCenter.x, atlasCenter.z - pointerRadius/2);
            ctx.lineTo(atlasCenter.x, atlasCenter.z + pointerRadius/2);
            ctx.stroke();
        }
    }
}
