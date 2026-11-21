import { readFileSync } from "fs";
import { join } from "path";

/** glTF JSON samples shared by the health tests (and the PHP parity test in Phase 3). */
export const fixture = (name: string): Record<string, any> =>
    JSON.parse(readFileSync(join(__dirname, "fixtures", "health", `${name}.gltf.json`), "utf8"));
