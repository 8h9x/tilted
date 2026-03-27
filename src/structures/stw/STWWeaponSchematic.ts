import STWSchematic from "./STWSchematic.ts";
import type {
  STWSchematicEvoType,
  STWSchematicMeleeSubType,
  STWSchematicRangedSubType,
} from "../../resources/structs.ts";

class STWWeaponSchematic extends STWSchematic {
  declare public type: "ranged" | "melee";
  declare public subType: STWSchematicRangedSubType | STWSchematicMeleeSubType;
  declare public evoType: STWSchematicEvoType;
}

export default STWWeaponSchematic;
