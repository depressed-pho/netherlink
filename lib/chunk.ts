import { Point, Point2D } from 'netherlink/point';

export class Chunk {
    /** Origin of the chunk (normalized, i.e. always multiple of
     * 16).
     */
    public readonly origin: Point2D;

    /** Construct a Chunk object containing a given point.
     */
    public constructor(pt: Point2D);
    public constructor(pt: Point);
    public constructor(pt: any) {
        this.origin = new Point2D(
            Math.floor(pt.x / 16) * 16,
            Math.floor(pt.z / 16) * 16);
    }

    /** Create a new Chunk object with a given offset.
     */
    public offset(x: number, z: number) {
        return new Chunk(
            new Point2D(
                this.origin.x + x * 16,
                this.origin.z + z * 16));
    }
}
