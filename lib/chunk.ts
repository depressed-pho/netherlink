import { Point } from 'netherlink/point';

export class Chunk {
    /** Origin of the chunk (normalized, i.e. always multiple of
     * 16). The Y coordinate is always 0.
     */
    public readonly origin: Point;

    /** Construct a Chunk object containing a given point.
     */
    public constructor(pt: Point) {
        this.origin = new Point(
            Math.floor(pt.x / 16) * 16,
            0,
            Math.floor(pt.z / 16) * 16);
    }

    /** Create a new Chunk object with a given offset.
     */
    public offset(x: number, z: number) {
        return new Chunk(
            new Point(
                this.origin.x + x * 16,
                0,
                this.origin.z + z * 16));
    }
}
