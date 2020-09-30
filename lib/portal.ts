import { Point } from 'netherlink/point';
import Color = require('color');

export class Portal {
    public readonly location: Point;
    public name: string;
    public color: Color;

    protected constructor(location: Point, name: string, color: Color) {
        this.location = location;
        this.name     = name;
        this.color    = color;
    }
}

export class PortalOnOverworld extends Portal {
}

export class PortalInNether extends Portal {
}
