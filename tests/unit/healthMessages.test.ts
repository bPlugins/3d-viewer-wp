import { ANCHORS, TROUBLESHOOTING_URL } from "../../src/utils/health/anchors";
import { editorView, healthMessage, severityLabel } from "../../src/utils/health/messages";
import type { Finding, FindingId } from "../../src/utils/health/types";

const f = (id: FindingId, severity: Finding["severity"], params?: Finding["params"]): Finding => ({ id, severity, params });
const FREE = { variant: "free" as const };

describe("healthMessage (free)", () => {
    test("labels never say 'is breaking'", () => {
        expect(["cause", "check", "note"].map((s) => severityLabel(s as Finding["severity"]))).toEqual(["Possible cause", "Worth checking", "Note"]);
    });

    test("H01 adds the Advanced hint only when Advanced opens the format", () => {
        expect(healthMessage(f("H01", "cause", { ext: "obj", advanced: true })).text).toBe("The Lite viewer can't open .obj files. Switch this viewer to Advanced.");
        expect(healthMessage(f("H01", "cause", { ext: "zip", advanced: false })).text).toBe("The Lite viewer can't open .zip files.");
    });

    test("H01b keeps the Advanced viewer wording", () => {
        expect(healthMessage(f("H01b", "cause", { url: "https://drive.google.com/file/d/x/view" })).text).toMatch(/^Google Drive links identify a file by ID/);
    });

    test("H09 reuses the size sentence; H06 is plural-aware", () => {
        expect(healthMessage(f("H09", "check", { size: 24.1 * 1024 * 1024 })).text).toBe("This file is 24.1 MB. Large models load slowly, especially on mobile.");
        expect(healthMessage(f("H06", "cause", { count: 1 })).text).toMatch(/points to 1 file that isn't there/);
        expect(healthMessage(f("H06", "cause", { count: 3 })).text).toMatch(/points to 3 files that aren't there/);
    });

    test("H14 says white without a Pro tool link", () => {
        const message = healthMessage(f("H14", "cause"));
        expect(message.text).toBe("Uses the legacy Specular-Glossiness materials, so it shows white.");
        expect(message.action).toBeNull();
        expect(message.howToFix.href).toBe(`${TROUBLESHOOTING_URL}#the-model-shows-up-white-with-no-colors`);
    });

    test("every free check has text and a troubleshooting anchor; no Pro links", () => {
        (Object.keys(ANCHORS) as FindingId[]).forEach((id) => {
            const message = healthMessage(f(id, "cause", { ext: "obj", exts: ["X"], count: 2, size: 1, url: "https://a.test/x" }));
            expect(message.text).not.toBe("");
            expect(message.action).toBeNull();
            expect(message.howToFix.href.startsWith(`${TROUBLESHOOTING_URL}#`)).toBe(true);
        });
    });
});

describe("editorView (free)", () => {
    test("shows Notes and size, causes first", () => {
        const view = editorView([f("H13", "note", { exts: ["KHR_draco_mesh_compression"] }), f("H09", "check", { size: 2e7 }), f("H04", "cause")], FREE);
        expect(view?.lines.map((line) => line.id)).toEqual(["H04", "H09", "H13"]);
        expect(view?.status).toBe("warning");
    });

    test("a fourth finding becomes +N more → the troubleshooting page", () => {
        const view = editorView([f("H01", "cause", { ext: "obj" }), f("H04", "cause"), f("H09", "check", { size: 2e7 }), f("H13", "note"), f("H03n", "note")], FREE);
        expect(view?.lines).toHaveLength(3);
        expect(view?.more).toMatchObject({ count: 2, href: TROUBLESHOOTING_URL, label: "+2 more" });
    });

    test("SpecGlossNotice's finding is suppressed; nothing left → no notice", () => {
        expect(editorView([f("H14", "cause")], { ...FREE, suppress: ["H14"] })).toBeNull();
    });

    test("only notes → info", () => {
        expect(editorView([f("H03n", "note")], FREE)?.status).toBe("info");
    });
});
