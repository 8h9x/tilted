import STWWeaponSchematic from "./STWWeaponSchematic.ts";
import type { STWSchematicMeleeSubType } from "../../resources/structs.ts";

class STWMeleeWeaponSchematic extends STWWeaponSchematic {
  declare public type: "melee";
  declare public subType: STWSchematicMeleeSubType;
}

export default STWMeleeWeaponSchematic;
