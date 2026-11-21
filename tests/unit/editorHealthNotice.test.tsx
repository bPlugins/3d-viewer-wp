/**
 * @jest-environment-options {"url": "https://dev.local/wp-admin/post.php"}
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { TextDecoder, TextEncoder } from "util";
import EditorHealthNotice from "../../src/components/EditorHealthNotice";
import { forgetModelHealth } from "../../src/hooks/useModelHealth";
import { forgetSpecGloss } from "../../src/utils/specGloss/detect";
import { fixture } from "./healthFixtures";

Object.assign(globalThis, { TextEncoder, TextDecoder });

jest.mock("@wordpress/element", () => jest.requireActual("react"));
jest.mock("../../../bpl-tools/Components/Notice", () => ({
    __esModule: true,
    default: ({ status, className, children }: any) => <div className={`bPlNotice ${status} ${className}`}>{children}</div>,
}));

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const glb = (json: object): ArrayBuffer => {
    const body = new TextEncoder().encode(JSON.stringify(json));
    const padded = body.length + ((4 - (body.length % 4)) % 4);
    const bytes = new Uint8Array(20 + padded).fill(0x20);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, bytes.length, true);
    view.setUint32(12, padded, true);
    view.setUint32(16, 0x4e4f534a, true);
    bytes.set(body, 20);
    return bytes.buffer;
};

describe("EditorHealthNotice (free)", () => {
    let host: HTMLDivElement;
    let root: Root;
    const realFetch = global.fetch;

    beforeEach(() => {
        jest.useFakeTimers();
        host = document.createElement("div");
        document.body.appendChild(host);
        root = createRoot(host);
        forgetModelHealth();
        forgetSpecGloss();
        const buffer = glb(fixture("specgloss"));
        global.fetch = jest.fn(async () => ({ ok: true, status: 200, headers: { get: () => null }, body: null, arrayBuffer: async () => buffer.slice(0) })) as any;
    });

    afterEach(() => {
        act(() => root.unmount());
        host.remove();
        global.fetch = realFetch;
        jest.useRealTimers();
    });

    const flush = async () => {
        for (let i = 0; i < 4; i++) {
            await act(async () => {
                jest.advanceTimersByTime(500);
                await Promise.resolve();
            });
        }
    };

    test("H14 stays with SpecGlossNotice for a URL Edit.tsx shows it for", async () => {
        act(() => root.render(<EditorHealthNotice modelUrl="https://dev.local/wp-content/uploads/bee.glb" />));
        await flush();
        expect(host.textContent).not.toContain("Specular-Glossiness");
    });

    test("H14 shows when SpecGlossNotice can't (a relative link)", async () => {
        act(() => root.render(<EditorHealthNotice modelUrl="/wp-content/uploads/bee.glb" />));
        await flush();
        expect(host.textContent).toContain("Possible cause: Uses the legacy Specular-Glossiness materials, so it shows white.");
    });
});
