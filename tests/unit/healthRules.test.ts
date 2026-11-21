import {
    ADVANCED_OK,
    COMPRESSION_EXTENSIONS,
    evaluateHealth,
    extOf,
    jsonFindings,
    LITE_OK,
    liteUnsupported,
    probeFindings,
    staticFindings,
} from "../../src/utils/health/rules";
import type { ProbeFacts } from "../../src/utils/health/types";
import { fixture } from "./healthFixtures";

const ids = (findings: { id: string; severity: string }[]) => findings.map((f) => `${f.id}:${f.severity}`);
const FREE = { variant: "free" as const, currentViewer: "modelViewer" };

describe("Lite/Advanced lists (moved from the classic preview)", () => {
    test("lists are unchanged", () => {
        expect(LITE_OK).toEqual(["glb", "gltf", "vrm", "php", "asp", "aspx", "ashx", "jsp", "cgi"]);
        expect(ADVANCED_OK).toEqual(["obj", "3ds", "stl", "ply", "off", "3dm", "fbx", "dae", "wrl", "3mf", "amf", "ifc", "brep", "step", "stp", "iges", "igs", "fcstd", "bim"]);
    });

    test("liteUnsupported keeps the preview's behavior", () => {
        expect(liteUnsupported({ model: { modelUrl: "https://a.test/m.obj" } })).toEqual(["obj"]);
        expect(liteUnsupported({ currentViewer: "O3DViewer", model: { modelUrl: "https://a.test/m.obj" } })).toEqual([]);
        expect(liteUnsupported({ model: { modelUrl: "https://a.test/m.glb" } })).toEqual([]);
        expect(liteUnsupported({ model: { modelUrl: "https://a.test/get.php?f=m.obj" } })).toEqual([]);
        expect(liteUnsupported({ model: { modelUrl: "https://drive.google.com/file/d/abc/view" } })).toEqual([]);
        expect(liteUnsupported({ model: { modelUrl: "https://a.test/m.FBX#frag" } })).toEqual(["fbx"]);
        expect(
            liteUnsupported({ multiple: true, models: [{ modelUrl: "a.obj" }, { modelUrl: "b.obj" }, { modelUrl: "c.stl" }, { modelUrl: 5 }] })
        ).toEqual(["obj", "stl"]);
    });

    test("compression list matches Pro's Optimize guard", () => {
        expect(COMPRESSION_EXTENSIONS).toEqual(["KHR_draco_mesh_compression", "EXT_meshopt_compression", "KHR_texture_basisu"]);
    });
});

describe("extOf", () => {
    test.each([
        ["https://a.test/m.GLB?x=1#y", "glb"],
        ["https://a.test/m.glb#a.obj", "glb"],
        ["https://a.test/get.php?f=m.obj", "php"],
        ["https://drive.google.com/file/d/abc/view", ""],
        ["", ""],
    ])("%s → %s", (url, ext) => expect(extOf(url)).toBe(ext));
});

describe("staticFindings", () => {
    test("H01 on Lite, with the Advanced hint only for formats Advanced opens", () => {
        expect(staticFindings("https://a.test/m.obj", "modelViewer")).toEqual([{ id: "H01", severity: "cause", params: { ext: "obj", advanced: true } }]);
        expect(staticFindings("https://a.test/m.zip")).toEqual([{ id: "H01", severity: "cause", params: { ext: "zip", advanced: false } }]);
    });

    test("H02 for files neither engine opens", () => {
        expect(ids(staticFindings("https://a.test/m.usdz", "modelViewer"))).toEqual(["H02:cause"]);
        expect(ids(staticFindings("https://a.test/m.blend", "O3DViewer"))).toEqual(["H02:cause"]);
    });

    test("no extension: no verdict on Lite, H01b on Advanced", () => {
        expect(staticFindings("https://drive.google.com/file/d/abc/view", "modelViewer")).toEqual([]);
        expect(ids(staticFindings("https://drive.google.com/file/d/abc/view", "O3DViewer"))).toEqual(["H01b:cause"]);
        expect(staticFindings("https://a.test/m.obj", "O3DViewer")).toEqual([]);
    });

    test("Advanced: a script endpoint or other non-model extension is H01b; formats it imports are fine", () => {
        expect(staticFindings("https://x.com/get.php?f=a.glb", "O3DViewer")).toEqual([
            { id: "H01b", severity: "cause", params: { url: "https://x.com/get.php?f=a.glb", ext: "php" } },
        ]);
        expect(ids(staticFindings("https://x.com/download.aspx?id=3", "O3DViewer"))).toEqual(["H01b:cause"]);
        ["m.glb", "m.gltf", "m.zip", "m.brp", "m.STEP", "m.fbx"].forEach((name) =>
            expect(staticFindings(`https://a.test/${name}`, "O3DViewer")).toEqual([])
        );
    });

    test("glTF and script endpoints are fine on Lite", () => {
        expect(staticFindings("https://a.test/m.glb")).toEqual([]);
        expect(staticFindings("https://a.test/get.php?f=x.glb")).toEqual([]);
        expect(staticFindings("")).toEqual([]);
    });
});

describe("jsonFindings", () => {
    test("required unsupported is a possible cause, merely used is a note", () => {
        const found = jsonFindings(
            { extensionsUsed: ["KHR_node_visibility", "KHR_animation_pointer", "KHR_materials_unlit"], extensionsRequired: ["KHR_node_visibility"] },
            FREE
        );
        expect(found).toEqual([
            { id: "H11", severity: "cause", params: { exts: ["KHR_node_visibility"] } },
            { id: "H11", severity: "note", params: { exts: ["KHR_animation_pointer"] } },
        ]);
    });

    test("required meshopt is a possible cause until the decoder ships", () => {
        expect(ids(jsonFindings(fixture("meshopt"), FREE))).toEqual(["H12:cause"]);
        expect(ids(jsonFindings(fixture("meshopt"), { ...FREE, meshoptDecoder: true }))).toEqual(["H12:note"]);
    });

    test("meshopt used but not required loads its fallback buffers: a note", () => {
        expect(jsonFindings({ extensionsUsed: ["EXT_meshopt_compression"] }, FREE)).toEqual([
            { id: "H12", severity: "note", params: { decoder: false, fallback: true } },
        ]);
    });

    test("malformed JSON never throws", () => {
        expect(() => jsonFindings({ extensionsUsed: { a: 1 }, extensionsRequired: 5, materials: [{ extensions: "x" }, null] }, FREE)).not.toThrow();
        expect(jsonFindings({ extensionsUsed: { a: 1 }, materials: [{ extensions: "x" }] }, FREE)).toEqual([]);
    });

    test("extension names from the file are filtered and capped", () => {
        const junk = ["<img src=x onerror=alert(1)>", "A".repeat(65)];
        const many = ["EXT_a", "EXT_b", "EXT_c", "EXT_d", "EXT_e", "EXT_f", "EXT_g"];
        expect(jsonFindings({ extensionsUsed: [...junk, ...many] }, FREE)).toEqual([
            { id: "H11", severity: "note", params: { exts: many.slice(0, 5) } },
        ]);
    });

    test("Draco and KTX2 are notes", () => {
        expect(jsonFindings(fixture("draco"), FREE)).toEqual([{ id: "H13", severity: "note", params: { exts: ["KHR_draco_mesh_compression"] } }]);
    });

    test("spec/gloss: cause, downgraded when every flagged material keeps a base color", () => {
        const json = fixture("specgloss");
        expect(ids(jsonFindings(json, FREE))).toEqual(["H14:cause"]);

        json.materials[0].pbrMetallicRoughness = { baseColorTexture: { index: 0 } };
        expect(ids(jsonFindings(json, FREE))).toEqual(["H14:note"]);
    });

    test("free never counts triangles", () => {
        const json = fixture("indexed");
        json.accessors[1].count = 1_000_000 * 3;
        expect(jsonFindings(json, FREE)).toEqual([]);
        expect(probeFindings("https://a.test/m.glb", { reach: "ok", status: 200, body: "glb", json }, { ...FREE, currentViewer: "O3DViewer" })).toEqual([]);
    });
});

describe("probeFindings", () => {
    const ok = (extra: Partial<ProbeFacts> = {}): ProbeFacts => ({ reach: "ok", status: 200, body: "glb", ...extra });

    test("no verdict when skipped or unknown", () => {
        expect(probeFindings("https://a.test/m.glb", { reach: "skipped" }, FREE)).toEqual([]);
        expect(probeFindings("https://a.test/m.glb", { reach: "unknown" }, FREE)).toEqual([]);
        expect(probeFindings("https://a.test/m.glb", null, FREE)).toEqual([]);
    });

    test("http on https: H03 when https fails, H03n note when it works", () => {
        expect(ids(probeFindings("http://a.test/m.glb", { reach: "unreachable", httpsUpgrade: "fails" }, FREE))).toEqual(["H03:cause"]);
        expect(ids(probeFindings("http://a.test/m.glb", ok({ httpsUpgrade: "works" }), FREE))).toEqual(["H03n:note"]);
    });

    test("404/410/5xx → H04 even with an HTML error page; 403 → H05", () => {
        expect(ids(probeFindings("https://a.test/m.glb", { reach: "http-error", status: 404 }, FREE))).toEqual(["H04:cause"]);
        expect(ids(probeFindings("https://a.test/m.glb", { reach: "http-error", status: 503 }, FREE))).toEqual(["H04:cause"]);
        expect(ids(probeFindings("https://a.test/m.glb", { reach: "http-error", status: 403 }, FREE))).toEqual(["H05:cause"]);
    });

    test("HTML or wrong magic bytes → H05", () => {
        expect(ids(probeFindings("https://a.test/m.glb", ok({ body: "html" }), FREE))).toEqual(["H05:cause"]);
        expect(ids(probeFindings("https://a.test/m.glb", ok({ body: "gltf" }), FREE))).toEqual(["H05:cause"]);
        expect(ids(probeFindings("https://a.test/m.gltf", ok({ body: "other" }), FREE))).toEqual(["H05:cause"]);
        expect(ids(probeFindings("https://a.test/get.php?f=1", ok({ body: "glb" }), FREE))).toEqual([]);
    });

    test("CORS and unreachable", () => {
        expect(probeFindings("https://b.test/m.glb", { reach: "cors" }, FREE)).toEqual([
            { id: "H07", severity: "cause", params: { origin: window.location.origin } },
        ]);
        expect(ids(probeFindings("https://b.test/m.glb", { reach: "unreachable" }, FREE))).toEqual(["H07u:check"]);
    });

    test("size at the threshold is worth checking; unknown size gives no verdict", () => {
        expect(ids(probeFindings("https://a.test/m.glb", ok({ size: 10 * 1024 * 1024 }), FREE))).toEqual(["H09:check"]);
        expect(ids(probeFindings("https://a.test/m.glb", ok({ size: 10 * 1024 * 1024 - 1 }), FREE))).toEqual([]);
        expect(ids(probeFindings("https://a.test/m.glb", ok({ size: 20 }), { ...FREE, heavyBytes: 10 }))).toEqual(["H09:check"]);
        expect(ids(probeFindings("https://a.test/m.glb", ok(), FREE))).toEqual([]);
    });

    test("missing .gltf siblings → H06", () => {
        expect(probeFindings("https://a.test/m.gltf", ok({ body: "gltf", missingSiblings: 2 }), FREE)).toEqual([
            { id: "H06", severity: "cause", params: { count: 2 } },
        ]);
    });

    test("JSON checks run on Lite only", () => {
        const facts = ok({ json: fixture("meshopt") });
        expect(ids(probeFindings("https://a.test/m.glb", facts, FREE))).toEqual(["H12:cause"]);
        expect(probeFindings("https://a.test/m.glb", facts, { ...FREE, currentViewer: "O3DViewer" })).toEqual([]);
        expect(probeFindings("https://a.test/m.glb", ok({ json: null }), FREE)).toEqual([]);
    });

    test("malformed JSON keeps the other findings", () => {
        const facts = ok({ size: 2e7, json: { extensionsUsed: { a: 1 }, materials: [{ extensions: "x" }] } });
        expect(ids(probeFindings("https://a.test/m.glb", facts, FREE))).toEqual(["H09:check"]);
    });
});

describe("evaluateHealth", () => {
    test("a file the engine can't open gets no content verdicts, but reachability still shows", () => {
        expect(ids(evaluateHealth("https://a.test/m.obj", { reach: "http-error", status: 404 }, FREE))).toEqual(["H01:cause", "H04:cause"]);
        expect(ids(evaluateHealth("https://a.test/m.obj", { reach: "ok", status: 200, body: "html", size: 99e6 }, FREE))).toEqual(["H01:cause"]);
    });

    test("a healthy GLB has no findings", () => {
        expect(evaluateHealth("https://a.test/m.glb", { reach: "ok", status: 200, body: "glb", json: fixture("plain") }, FREE)).toEqual([]);
    });
});
