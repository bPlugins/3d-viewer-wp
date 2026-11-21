/**
 * 20c (plan RELEASE-2.4.0 §2.6, D10): free's block.json declares Pro's attribute names, typed and without a default,
 * so a Pro-built block keeps its settings when saved under free, and free-only blocks serialize exactly as in 2.1.1.
 * Free's block saves no markup (`save: () => null`) and none of the new names has a default, so no `deprecated` entry.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { createBlock, parse, registerBlockType, serialize } from "@wordpress/blocks";
import { isLazy, toggleLazy } from "../../src/blocks/3d-viewer/lazyLoad";
import current from "../../src/blocks/3d-viewer/block.json";
import legacy from "./fixtures/block-2.1.1.json";

// Pro's block.json when the Pro repo sits next to this one (local development); CI skips that check.
const PRO_JSON = join(__dirname, "../../../3d-viewer-premium/src/blocks/3d-viewer/block.json");
const pro = existsSync(PRO_JSON) ? JSON.parse(readFileSync(PRO_JSON, "utf8")) : null;

const NAME = "b3dviewer/modelviewer";
const OLD = "b3dviewer-test/modelviewer-2-1-1";
const settings = { edit: () => null, save: () => null } as any;

beforeAll(() => {
    registerBlockType({ ...current, name: NAME } as any, settings);
    registerBlockType({ ...legacy, name: OLD } as any, settings);
});

// A block as Pro 2.3 saves it: only non-default values, lazyLoad as a string.
const PRO_ATTRS = {
    uniqueId: "b3dviewer1a2b3c4d",
    multiple: true,
    models: [
        { modelUrl: "https://a.test/one.glb", poster: "", useDecoder: "none" },
        { modelUrl: "https://a.test/two.glb", poster: "https://a.test/two.jpg", useDecoder: "none" },
    ],
    model: { modelUrl: "https://a.test/one.glb", arEnabled: true, arPlacement: "floor", arMode: "quick-look", arScale: "fixed" },
    lazyLoad: "eager",
    autoplay: false,
    autoRotate: true,
    rotationPerSecond: 35,
    rotateAlongX: 10,
    rotateAlongY: 60,
    zoomLevel: 1.5,
    hotspots: [{ id: "h1", position: "0m 1m 0m", normal: "0m 1m 0m", text: "Handle", type: "text" }],
    stylesheet: ".x{color:red}",
    additional: { ID: "hero", Class: "shine", CSS: "" },
    mobile: { imageMode: "image", tapLabel: "Tap", breakpoint: 600, reduceMotion: true },
    dimensions: { mode: "always", unit: "in", color: "#ff0000" },
    explode: { enabled: true, distance: 70, grouping: "mesh" },
    controls: { labels: "hover", text: { zoom: "Zoom" } },
    variantSelector: { style: "swatches", labels: "tooltip", placement: "below", position: "top-right", size: 28, swatches: [], defaultVariant: "Red" },
    toneMapping: "aces",
    useEnvironmentAsSkybox: true,
    lockXAxisRotation: true,
    pins: { size: 32, color: "#000000", background: "#ffffff" },
};

const comment = (name: string, attrs: object) => `<!-- wp:${name} ${JSON.stringify(attrs)} /-->`;
const roundTrip = (content: string) => serialize(parse(content));

describe("Pro attribute passthrough", () => {
    (pro ? test : test.skip)("free declares every Pro attribute with Pro's type and no default", () => {
        const proAttrs = pro.attributes;
        const freeAttrs = (current as any).attributes;
        const legacyAttrs = (legacy as any).attributes;

        Object.keys(proAttrs).forEach((key) => {
            expect(freeAttrs).toHaveProperty(key);
            if (key in legacyAttrs) return;
            expect(freeAttrs[key].type).toEqual(proAttrs[key].type);
            expect(freeAttrs[key]).not.toHaveProperty("default");
            if (proAttrs[key].enum) expect(freeAttrs[key].enum).toEqual(proAttrs[key].enum);
        });
    });

    test("only lazyLoad changed among the 2.1.1 attributes", () => {
        const legacyAttrs = (legacy as any).attributes;
        Object.keys(legacyAttrs).forEach((key) => {
            if (key === "lazyLoad") return;
            expect((current as any).attributes[key]).toEqual(legacyAttrs[key]);
        });
        expect((current as any).attributes.lazyLoad).toEqual({ type: ["boolean", "string"], default: true });
    });

    test("a Pro-built block keeps every Pro attribute through a free save", () => {
        const [block] = parse(comment(NAME, PRO_ATTRS));
        expect(block.isValid).toBe(true);
        Object.entries(PRO_ATTRS).forEach(([key, value]) => expect(block.attributes[key]).toEqual(value));

        const [again] = parse(serialize([block]));
        Object.entries(PRO_ATTRS).forEach(([key, value]) => expect(again.attributes[key]).toEqual(value));
    });

    test("2.1.1 dropped them (the bug this fixes)", () => {
        const [block] = parse(comment(OLD, PRO_ATTRS));
        expect(block.attributes.hotspots).toBeUndefined();
        expect(block.attributes.lazyLoad).toBe(true);
    });

    test.each([
        ["eager", "eager"],
        ["auto", "auto"],
        ["lazy", "lazy"],
        [false, false],
    ])("lazyLoad %p survives a save", (value, expected) => {
        const [block] = parse(comment(NAME, { lazyLoad: value }));
        expect(block.attributes.lazyLoad).toBe(expected);
        expect(parse(serialize([block]))[0].attributes.lazyLoad).toBe(expected);
    });

    test("a value of the wrong type falls back as Pro would (no notice, no crash)", () => {
        const [block] = parse(comment(NAME, { hotspots: "oops", rotateAlongY: "75", lazyLoad: 3 }));
        expect(block.attributes.hotspots).toBeUndefined();
        expect(block.attributes.rotateAlongY).toBeUndefined();
        expect(block.attributes.lazyLoad).toBe(true);
    });
});

describe("free-only blocks serialize exactly as in 2.1.1", () => {
    const samples: Record<string, unknown>[] = [
        {},
        { uniqueId: "b3dviewerabcdef12", model: { modelUrl: "https://a.test/m.glb", arEnabled: false } },
        { uniqueId: "b3dviewerabcdef12", lazyLoad: false, currentViewer: "O3DViewer", O3DVSettings: { isFullscreen: false, camera: null } },
        { styles: { width: { desktop: "80%", tablet: "100%", mobile: "100%" }, height: { desktop: "500px", tablet: "300px", mobile: "300px" }, bgColor: "#fff" }, shadow: false, exposure: 1.4 },
    ];

    test.each(samples.map((attrs, i) => [i, attrs]))("sample %i", (_i, attrs) => {
        const before = serialize([createBlock(OLD, attrs as any)]).replace(OLD, NAME);
        const after = serialize([createBlock(NAME, attrs as any)]);
        expect(after).toBe(before);
        expect(roundTrip(after)).toBe(after);
    });
});

describe("free Lazy Load toggle", () => {
    test("shows Pro's eager as off and auto/lazy as on", () => {
        expect([true, false, undefined, "auto", "lazy", "eager"].map(isLazy)).toEqual([true, false, true, true, true, false]);
    });

    test("keeps a string a string and a boolean a boolean", () => {
        expect(toggleLazy(true)).toBe(false);
        expect(toggleLazy(false)).toBe(true);
        expect(toggleLazy("eager")).toBe("lazy");
        expect(toggleLazy("auto")).toBe("eager");
        expect(toggleLazy("lazy")).toBe("eager");
    });
});
