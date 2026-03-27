import STWSchematic from "./STWSchematic.ts";
import type { STWSchematicTrapSubType } from "../../resources/structs.ts";

class STWTrapSchematic extends STWSchematic {
  declare public type: "trap";
  declare public subType: STWSchematicTrapSubType;
  declare public evoType: never;
}

export default STWTrapSchematic;
