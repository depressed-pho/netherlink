export class Point {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;

    public constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public toString(): string {
        return `${this.x}, ${this.y}, ${this.z}`;
    }

/*
    offset(x: number, z: number): Point {
        return new Point(this.x + x, this.z + z);
    }

    round(): Point {
        return new Point(Math.round(this.x), Math.round(this.z));
    }

    distance(p1: Point): number {
        return Math.sqrt(Math.pow(p1.x - this.x, 2) + Math.pow(p1.z - this.z, 2));
    }
*/
}
