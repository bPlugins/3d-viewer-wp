import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import MoreInPro, { isSnoozed, proItems, snooze, SNOOZE_KEY } from "../../src/blocks/3d-viewer/Components/Backend/MoreInPro";

jest.mock("@wordpress/element", () => jest.requireActual("react"));
jest.mock("@wordpress/components", () => ({
    Button: ({ label, onClick, className }: any) => <button type="button" aria-label={label} className={className} onClick={onClick} />,
}));
// The shared bpl-tools badge lives outside this package; a plain stand-in keeps its contract.
jest.mock("../../../bpl-tools/ProControls", () => ({
    __esModule: true,
    PremiumBadge: ({ label }: any) => <span className="badge">{label}</span>,
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const setVersion = (version: string) => ((window as any).bp3dBlock = { admin_url: "https://dev.local/wp-admin/", version });

describe("More in Pro rows", () => {
    let host: HTMLDivElement;
    let root: Root;

    beforeEach(() => {
        window.localStorage.clear();
        setVersion("2.4.0");
        host = document.createElement("div");
        document.body.appendChild(host);
        root = createRoot(host);
    });

    afterEach(() => {
        act(() => root.unmount());
        host.remove();
    });

    test("never labels what free already ships", () => {
        const all = [...proItems.model(true), ...proItems.options(), ...proItems.advanced(), ...proItems.style()].join(" | ").toLowerCase();
        ["ar", "shadow"].forEach((word) => expect(all).not.toMatch(new RegExp(`\\b${word}\\b`)));
        expect(all).not.toMatch(/environment image(?! as skybox)/);
        expect(proItems.model(false)).toEqual(["Multiple models, with thumbnails and arrows"]);
    });

    test("rows link to pricing; dismissing snoozes until the next free version", () => {
        act(() => root.render(<MoreInPro panel="options" items={proItems.options()} />));
        expect(host.querySelectorAll(".bp3dMoreInPro__row")).toHaveLength(5);
        expect(host.querySelector("a")?.getAttribute("href")).toContain("page=3d-viewer#/pricing");

        act(() => host.querySelector<HTMLButtonElement>(".bp3dMoreInPro__dismiss")!.click());
        expect(host.innerHTML).toBe("");
        expect(JSON.parse(window.localStorage.getItem(SNOOZE_KEY) || "{}")).toEqual({ options: "2.4.0" });

        act(() => root.render(<MoreInPro key="model" panel="model" items={proItems.model(true)} />));
        expect(host.querySelectorAll(".bp3dMoreInPro__row")).toHaveLength(4);

        expect(isSnoozed("options")).toBe(true);
        setVersion("2.4.1");
        expect(isSnoozed("options")).toBe(false);
    });

    test("broken or blocked storage never hides the rows for good", () => {
        window.localStorage.setItem(SNOOZE_KEY, "not json");
        expect(isSnoozed("style")).toBe(false);

        const setItem = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
            throw new Error("blocked");
        });
        expect(() => snooze("style")).not.toThrow();
        setItem.mockRestore();

        setVersion("");
        snooze("style");
        expect(isSnoozed("style")).toBe(false);
    });
});
