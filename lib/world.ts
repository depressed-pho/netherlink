import { PortalOnOverworld, PortalInNether } from 'netherlink/portal';
import { PortalMap } from 'netherlink/portal/map';
import * as uuid from 'uuid';

export type WorldID = string; // UUID v1

export class World {
    public readonly id: WorldID;
    public name: string;
    public readonly portalsOnOverworld: PortalMap<PortalOnOverworld>;
    public readonly portalsInNether: PortalMap<PortalInNether>;

    public constructor(name: string, id?: WorldID) {
        this.id   = id ? id : uuid.v1();
        this.name = name;
        this.portalsOnOverworld = new PortalMap<PortalOnOverworld>();
        this.portalsInNether    = new PortalMap<PortalInNether>();
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
