import STWWeaponSchematic from "./STWWeaponSchematic.ts";
import type { STWSchematicRangedSubType } from "../../resources/structs.ts";

class STWRangedWeaponSchematic extends STWWeaponSchematic {
  declare public type: "ranged";
  declare public subType: STWSchematicRangedSubType;
}

export default STWRangedWeaponSchematic;
