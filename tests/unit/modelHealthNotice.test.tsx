import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import ModelHealthNotice from "../../src/components/ModelHealthNotice";
import { forgetModelHealth } from "../../src/hooks/useModelHealth";

jest.mock("@wordpress/element", () => ({ ...jest.requireActual("react"), createRoot: jest.requireActual("react-dom/client").createRoot }));
// The shared bpl-tools Notice lives outside this package; a plain stand-in keeps its contract.
jest.mock("../../../bpl-tools/Components/Notice", () => ({
    __esModule: true,
    default: ({ status, className, children }: any) => <div className={`bPlNotice ${status} ${className}`}>{children}</div>,
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("ModelHealthNotice", () => {
    let host: HTMLDivElement;
    let root: Root;
    const realFetch = global.fetch;

    beforeEach(() => {
        jest.useFakeTimers();
        host = document.createElement("div");
        document.body.appendChild(host);
        root = createRoot(host);
        forgetModelHealth();
        global.fetch = jest.fn(async () => ({ ok: false, status: 404, headers: { get: () => null }, body: null })) as any;
    });

    afterEach(() => {
        act(() => root.unmount());
        host.remove();
        global.fetch = realFetch;
        jest.useRealTimers();
    });

    const flush = async () => {
        await act(async () => {
            jest.advanceTimersByTime(500);
        });
        await act(async () => {
            await Promise.resolve();
        });
    };

    test("nothing shows while a link is typed; the URL rule and the probe follow the debounce", async () => {
        act(() => root.render(<ModelHealthNotice modelUrl="/wp-content/uploads/m.g" variant="free" />));
        act(() => root.render(<ModelHealthNotice modelUrl="/wp-content/uploads/m.gl" variant="free" />));
        act(() => root.render(<ModelHealthNotice modelUrl="/wp-content/uploads/m.obj" variant="free" />));
        expect(host.innerHTML).toBe("");
        act(() => {
            jest.advanceTimersByTime(399);
        });
        expect(host.innerHTML).toBe("");

        await flush();
        expect(host.textContent).toContain("Possible cause: The Lite viewer can't open .obj files. Switch this viewer to Advanced.");
        expect(host.textContent).not.toMatch(/\.g files|\.gl files/);
        expect(host.textContent).toContain("The file can't be found.");
        const links = Array.from(host.querySelectorAll("a")).map((a) => a.getAttribute("href"));
        expect(links.every((href) => href?.startsWith("https://bplugins.com/docs/3d-viewer/troubleshooting/#"))).toBe(true);
    });

    test("no URL, or a healthy result, renders nothing", async () => {
        act(() => root.render(<ModelHealthNotice modelUrl="" variant="free" />));
        expect(host.innerHTML).toBe("");

        act(() => root.render(<ModelHealthNotice modelUrl="dropbox:/robot.glb" variant="free" />));
        await flush();
        expect(host.innerHTML).toBe("");
    });

    test("multiple models: a problem in model 2 shows, and repeats merge into one line", async () => {
        global.fetch = jest.fn(async () => ({ ok: true, status: 200, headers: { get: () => null }, body: null, arrayBuffer: async () => new ArrayBuffer(0) })) as any;
        const urls = ["/wp-content/uploads/a.glb", "/wp-content/uploads/b.obj", "/wp-content/uploads/c.obj"];
        act(() => root.render(<ModelHealthNotice modelUrl={urls} variant="free" />));
        await flush();
        expect(host.querySelectorAll(".bp3dModelHealthNotice__line")).toHaveLength(1);
        expect(host.textContent).toContain("The Lite viewer can't open .obj files.");
    });
});
