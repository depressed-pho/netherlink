export interface Dimension {
    readonly name: string;
};

export class Overworld implements Dimension {
    public get name(): string {
        return "Overworld";
    }

    public toString(): string {
        return this.name;
    }
};

export class Nether implements Dimension {
    public get name(): string {
        return "Nether";
    }

    public toString(): string {
        return this.name;
    }
};

export const overworld = new Overworld();
export const nether    = new Nether();
