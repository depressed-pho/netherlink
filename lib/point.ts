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

    public equals(that: Point): boolean {
        return this.x == that.x && this.y == that.y && this.z == that.z;
    }

    public static equals(a: Point, b: Point): boolean {
        return a.equals(b);
    }

    public toString(): string {
        return `${this.x}, ${this.y}, ${this.z}`;
    }

    public within([from, to]: [Point, Point]): boolean {
        return this.x >= from.x && this.x < to.x &&
               this.y >= from.y && this.y < to.y &&
               this.z >= from.z && this.z < to.z;
    }

    public offset(x: number, y: number, z: number): Point {
        return new Point(this.x + x, this.y + y, this.z + z);
    }

    public round(): Point {
        return new Point(Math.round(this.x), Math.round(this.y), Math.round(this.z));
    }

    public static distance(p1: Point, p2: Point): number {
        return Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2) + Math.pow(p2.z - p1.z, 2));
    }
}

export class Point2D {
    public readonly x: number;
    public readonly z: number;

    public constructor(x: number, z: number) {
        this.x = x;
        this.z = z;
    }
}
