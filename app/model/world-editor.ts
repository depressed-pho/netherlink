import * as Bacon from 'baconjs';
import { Dimension, Overworld, Nether } from 'netherlink/dimension';
import { Portal } from 'netherlink/portal';
import { World } from 'netherlink/world';
import { WorldSelectorModel } from './world-selector';

export class WorldEditorModel {
    private readonly selModel: WorldSelectorModel;

    private readonly portalsOnOverworld: Bacon.Property<Set<Portal<Overworld>>>;
    private readonly portalsInNether: Bacon.Property<Set<Portal<Nether>>>;

    private readonly chosenPortalOnOverworldBus: Bacon.Bus<Portal<Overworld>|null>;
    private readonly chosenPortalOnOverworld: Bacon.Property<Portal<Overworld>|null>;

    private readonly chosenPortalInNetherBus: Bacon.Bus<Portal<Nether>|null>;
    private readonly chosenPortalInNether: Bacon.Property<Portal<Nether>|null>;

    public constructor(selModel: WorldSelectorModel) {
        this.selModel = selModel;

        this.portalsOnOverworld = this.selModel.activeWorld.map(w => {
            return new Set<Portal<Overworld>>(w.portalsOnOverworld);
        });
        this.portalsInNether = this.selModel.activeWorld.map(w => {
            return new Set<Portal<Nether>>(w.portalsInNether);
        });

        this.chosenPortalOnOverworldBus = new Bacon.Bus<Portal<Overworld>|null>();
        this.chosenPortalOnOverworld    = this.chosenPortalOnOverworldBus.toProperty(null);

        this.chosenPortalInNetherBus    = new Bacon.Bus<Portal<Nether>|null>();
        this.chosenPortalInNether       = this.chosenPortalInNetherBus.toProperty(null);
    }

    /* Events indicating portal lists need to be refreshed. */
    public portals<D extends Dimension>(dimension: D): Bacon.Property<Set<Portal<D>>> {
        if (dimension instanceof Overworld) {
            /* Now we know D is Overworld but TypeScript doesn't allow
             * us to do this without coercing to any. Possibly a
             * bug? */
            return this.portalsOnOverworld as any;
        }
        else if (dimension instanceof Nether) {
            return this.portalsInNether as any;
        }
        else {
            throw new Error(`Unsupported dimension: ${dimension}`);
        }
    }

    /* Events indicating a different portal has been chosen. */
    public chosenPortal<D extends Dimension>(dimension: D): Bacon.Property<Portal<D>> {
        if (dimension instanceof Overworld) {
            /* Now we know D is Overworld but TypeScript doesn't allow
             * us to do this without coercing to any. Possibly a
             * bug? */
            return this.chosenPortalOnOverworld as any;
        }
        else if (dimension instanceof Nether) {
            return this.chosenPortalInNether as any;
        }
        else {
            throw new Error(`Unsupported dimension: ${dimension}`);
        }
    }
}
