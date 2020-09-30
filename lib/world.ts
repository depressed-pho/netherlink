import { PortalOnOverworld, PortalInNether } from 'netherlink/portal';
import { PortalMap } from 'netherlink/portal/map';
import * as uuid from 'uuid';

export type WorldID = string; // UUID

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
}
