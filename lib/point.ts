export class Point {
    public readonly x: number;
    public readonly y: number;
    public readonly z: number;

    public static readonly origin: Point
        = new Point(0, 0, 0);

    public constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public toString(): string {
        return `${this.x}, ${this.y}, ${this.z}`;
    }

    public static distance(p1: Point, p2: Point): number {
        return Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2));
    }
}
