import { Dimension, Overworld, Nether, overworld, nether } from 'netherlink/dimension';
import { Portal } from 'netherlink/portal';
import { PortalSet } from 'netherlink/portal/set';
import * as uuid from 'uuid';
import Color = require('color');

// FIXME: remove these
import { Point } from 'netherlink/point';

export type WorldID = string; // UUID v1

export class World {
    public readonly id: WorldID;
    public name: string;
    private readonly portalsInOverworld: PortalSet<Overworld>;
    private readonly portalsInNether: PortalSet<Nether>;

    public constructor(name: string, id?: WorldID) {
        this.id   = id ? id : uuid.v1();
        this.name = name;
        this.portalsInOverworld = new PortalSet<Overworld>();
        this.portalsInNether    = new PortalSet<Nether>();

        // FIXME: remove this
        this.portalsInOverworld.add(
            new Portal<Overworld>(
                overworld,
                new Point(1, 1, 1),
                "Portal #1",
                Color.rgb(255, 0, 0)));

        this.portalsInNether.add(
            new Portal<Nether>(
                nether,
                new Point(10, 10, 10),
                "Portal #2",
                Color.rgb(0, 100, 100)));

    }

    public portals<D extends Dimension>(dimension: D): PortalSet<D> {
        if (dimension instanceof Overworld) {
            /* Now we know D is Overworld but TypeScript doesn't allow
             * us to do this without a type coercion. Possibly a
             * bug? */
            return this.portalsInOverworld as any;
        }
        else if (dimension instanceof Nether) {
            return this.portalsInNether as any;
        }
        else {
            throw new Error(`Unsupported dimension: ${dimension}`);
        }
    }

    get newPortalNameCandidate(): string {
        const names = new Set<string>();
        for (let p of this.portalsInOverworld) {
            names.add(p.name);
        }
        for (let p of this.portalsInNether) {
            names.add(p.name);
        }

        const nPortals = this.portalsInOverworld.size + this.portalsInNether.size;
        if (!names.has(`Portal #${nPortals + 1}`)) {
            return `Portal #${nPortals + 1}`;
        }

        for (let i = 1;; i++) {
            if (!names.has(`Portal #${i}`)) {
                return `Portal #${i}`;
            }
        }
    }

    get newPortalColorCandidate(): Color {
        // hsv: s = 1.0, v = 0.4
        // hsl: l = 0.2, s = 1.0

        /* We generate a color in HSV color model where saturation and
         * value are both fixed at 100% and 40% respectively. Hue is
         * chosen randomly. */
        return new Color({
            h: Math.floor(Math.random() * 360),
            s: 100,
            v: 40
        });
    }

    /** Compare two worlds by their ID. */
    public static compare(w1: World, w2: World): -1|0|1 {
        const a1 = uuid.parse(w1.id);
        const a2 = uuid.parse(w2.id);

        if      (a1[6] < a2[6]) { return -1 } // time_hi_version[0]
        else if (a1[6] > a2[6]) { return  1 }

        if      (a1[7] < a2[7]) { return -1 } // time_hi_version[1]
        else if (a1[7] > a2[7]) { return  1 }

        if      (a1[4] < a2[4]) { return -1 } // time_mid[0]
        else if (a1[4] > a2[4]) { return  1 }

        if      (a1[5] < a2[5]) { return -1 } // time_mid[1]
        else if (a1[5] > a2[5]) { return  1 }

        if      (a1[0] < a2[0]) { return -1 } // time_low[0]
        else if (a1[0] > a2[0]) { return  1 }

        if      (a1[1] < a2[1]) { return -1 } // time_low[1]
        else if (a1[1] > a2[1]) { return  1 }

        if      (a1[2] < a2[2]) { return -1 } // time_low[2]
        else if (a1[2] > a2[2]) { return  1 }

        if      (a1[3] < a2[3]) { return -1 } // time_low[3]
        else if (a1[3] > a2[3]) { return  1 }

        return 0;
    }
}
