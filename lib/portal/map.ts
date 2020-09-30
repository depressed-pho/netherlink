import { Portal } from 'netherlink/portal';

export class PortalMap<T extends Portal> {
    private readonly map: Map<string, T>; // toString() of location as a key

    public constructor() {
        this.map = new Map<string, T>();
    }
}
