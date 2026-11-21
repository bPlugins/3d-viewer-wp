/**
 * @jest-environment-options {"url": "https://dev.local/wp-admin/post.php"}
 */
import { TextDecoder, TextEncoder } from "util";
import { evaluateHealth } from "../../src/utils/health/rules";
import { GLTF_JSON_CAP, healthKey, mediaLibrarySize, probeModel, sniffBody, siblingUrls } from "../../src/utils/health/probe";
import { fixture } from "./healthFixtures";

Object.assign(globalThis, { TextEncoder, TextDecoder });

const enc = (text: string) => new TextEncoder().encode(text);

const glb = (json: object, padTo = 0): Uint8Array => {
    let text = JSON.stringify(json);
    if (padTo > text.length) text = text.slice(0, -1) + `,"pad":"${" ".repeat(padTo - text.length)}"}`;
    const body = enc(text);
    const padded = body.length + ((4 - (body.length % 4)) % 4);
    const bytes = new Uint8Array(20 + padded).fill(0x20);
    const view = new DataView(bytes.buffer);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, bytes.byteLength, true);
    view.setUint32(12, padded, true);
    view.setUint32(16, 0x4e4f534a, true);
    bytes.set(body, 20);
    return bytes;
};

/** A minimal Response: streamed body in chunks, lower-cased header lookup. */
const respond = (status: number, bytes: Uint8Array = new Uint8Array(0), headers: Record<string, string> = {}, chunk = 16 * 1024) => {
    let offset = 0;
    const cancel = jest.fn(async () => undefined);
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
        body: {
            cancel,
            getReader: () => ({
                read: async () => {
                    if (offset >= bytes.byteLength) return { done: true, value: undefined };
                    const value = bytes.subarray(offset, offset + chunk);
                    offset += chunk;
                    return { done: false, value };
                },
                cancel,
            }),
        },
        arrayBuffer: async () => bytes.slice().buffer,
        read: () => offset,
    };
};

type Route = (init: any) => any;
const realFetch = global.fetch;
let routes: Record<string, Route> = {};
let fetchMock: jest.Mock;

beforeEach(() => {
    routes = {};
    fetchMock = jest.fn(async (url: string, init: any = {}) => {
        const route = routes[url];
        if (!route) throw new TypeError("Failed to fetch");
        return route(init);
    });
    global.fetch = fetchMock as any;
});
afterEach(() => {
    global.fetch = realFetch;
    delete (window as any).wp;
});

const SAME = "https://dev.local/wp-content/uploads/2026/11/robot.glb";
const OTHER = "https://cdn.other.test/robot.glb";

describe("sniffBody", () => {
    test.each([
        [enc("glTF\u0002\u0000\u0000\u0000"), "", "glb"],
        [enc('﻿  {"asset":{}}'), "", "gltf"],
        [enc("<!DOCTYPE html><html>"), "", "html"],
        [enc("\n<html lang=en>"), "", "html"],
        [enc("<?xml version='1.0'?><Error/>"), "application/xml", "other"],
        [enc("<head></head>"), "text/html; charset=UTF-8", "html"],
        [enc("<head><title>Login</title></head><body>"), "", "html"],
        [enc(" ".repeat(40) + "<!DOCTYPE html>"), "", "html"],
        [new Uint8Array(0), "", "empty"],
    ])("%#", (bytes, type, kind) => expect(sniffBody(bytes as Uint8Array, type as string)).toBe(kind));
});

describe("probeModel", () => {
    test("same-origin GLB: status, magic, size from Content-Length and the JSON chunk", async () => {
        const bytes = glb(fixture("draco"));
        routes[SAME] = () => respond(200, bytes, { "content-length": String(bytes.byteLength), "content-type": "model/gltf-binary" });

        const facts = await probeModel(SAME);
        expect(facts).toMatchObject({ reach: "ok", status: 200, body: "glb", size: bytes.byteLength });
        expect(facts.json?.extensionsRequired).toEqual(["KHR_draco_mesh_compression"]);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("a JSON chunk past the first read keeps streaming up to it", async () => {
        routes[SAME] = () => respond(200, glb({ asset: { version: "2.0" } }, 200 * 1024));
        expect((await probeModel(SAME)).json?.asset?.version).toBe("2.0");
    });

    test("a GLB whose JSON chunk is over the cap gives unknown JSON", async () => {
        const bytes = glb({ asset: {} });
        new DataView(bytes.buffer).setUint32(12, GLTF_JSON_CAP + 4, true);
        routes[SAME] = () => respond(200, bytes);
        expect((await probeModel(SAME)).json).toBeNull();
    });

    test("a .gltf over 4 MB is unknown, by Content-Length or by stream", async () => {
        const url = "https://dev.local/wp-content/uploads/big.gltf";
        routes[url] = () => respond(200, enc("{}"), { "content-length": String(GLTF_JSON_CAP + 1) });
        expect(await probeModel(url)).toMatchObject({ reach: "ok", body: "gltf", json: null });

        const big = new Uint8Array(GLTF_JSON_CAP + 10).fill(0x20);
        big[0] = 0x7b;
        routes[url] = () => respond(200, big, {}, 1024 * 1024);
        expect((await probeModel(url)).json).toBeNull();
    });

    test(".gltf siblings: only a 404/410 counts as missing (H06)", async () => {
        const url = "https://dev.local/wp-content/uploads/scene/model.gltf";
        routes[url] = () => respond(200, enc(JSON.stringify(fixture("missing-bin"))));
        routes["https://dev.local/wp-content/uploads/scene/scene.bin"] = () => respond(404);
        routes["https://dev.local/wp-content/uploads/scene/textures/wood.png"] = () => respond(206, enc("x"));

        const facts = await probeModel(url);
        expect(facts.missingSiblings).toBe(1);
        expect(fetchMock.mock.calls.filter(([u]) => /scene\.bin|wood\.png/.test(u)).every(([, init]) => init.headers.Range === "bytes=0-0")).toBe(true);
    });

    test("an HTML page instead of a model", async () => {
        routes[SAME] = () => respond(200, enc("<!doctype html><title>Log in</title>"), { "content-type": "text/html" });
        expect(await probeModel(SAME)).toMatchObject({ reach: "ok", body: "html" });
        expect((await probeModel(SAME)).json).toBeUndefined();
    });

    test("an error status is reported without reading the body", async () => {
        routes[SAME] = () => respond(404, enc("<html>Not found</html>"));
        expect(await probeModel(SAME)).toEqual({ reach: "http-error", status: 404 });
    });

    test("cross-origin TypeError then a resolving no-cors fetch → CORS missing", async () => {
        fetchMock.mockImplementation(async (_url: string, init: any = {}) => {
            if (init.mode === "no-cors") return { ok: false, status: 0, type: "opaque" };
            throw new TypeError("Failed to fetch");
        });
        expect(await probeModel(OTHER)).toEqual({ reach: "cors" });
    });

    test("both fetches throwing → couldn't reach, with no status verdict", async () => {
        expect(await probeModel(OTHER)).toEqual({ reach: "unreachable" });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    test("same-origin TypeError skips the no-cors retry", async () => {
        expect(await probeModel(SAME)).toEqual({ reach: "unreachable" });
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("size: Content-Length on a CORS-enabled 200; never from a 206 or Content-Range", async () => {
        routes[OTHER] = () => respond(200, glb({}), { "content-length": "4096" });
        expect((await probeModel(OTHER)).size).toBe(4096);

        routes[OTHER] = () => respond(206, glb({}), { "content-range": "bytes 0-19/99999999", "content-length": "20" });
        expect((await probeModel(OTHER)).size).toBeUndefined();
    });

    test("the media frame's filesizeInBytes wins", async () => {
        routes[SAME] = () => respond(200, glb({}), { "content-length": "100" });
        expect((await probeModel(SAME, { knownSize: 25e6 })).size).toBe(25e6);
    });

    test("http on an https admin probes the https variant (F4)", async () => {
        routes["https://old.test/m.glb"] = () => respond(200, glb({}));
        expect(await probeModel("http://old.test/m.glb")).toMatchObject({ reach: "ok", httpsUpgrade: "works" });
        expect(fetchMock.mock.calls[0][0]).toBe("https://old.test/m.glb");

        expect(await probeModel("http://dead.test/m.glb")).toEqual({ reach: "unreachable", httpsUpgrade: "fails" });
    });

    test("an https 404 proves https works, so the missing file shows (H03n + H04, not H03)", async () => {
        routes["https://old.test/gone.glb"] = () => respond(404, enc("<html>Not found</html>"));
        const facts = await probeModel("http://old.test/gone.glb");
        expect(facts).toEqual({ reach: "http-error", status: 404, httpsUpgrade: "works" });
        expect(evaluateHealth("http://old.test/gone.glb", facts, { variant: "free" }).map((f) => f.id)).toEqual(["H03n", "H04"]);
    });

    test("an extensionless login page with leading whitespace is HTML", async () => {
        const url = "https://dev.local/download";
        routes[url] = () => respond(200, enc(" ".repeat(40) + "<head><title>Log in</title></head>"));
        expect(await probeModel(url)).toMatchObject({ reach: "ok", body: "html" });
    });

    test("Pro signing: signed URL is fetched; unsignable or dropbox: gets no browser verdict", async () => {
        const signed = "https://bucket.s3.test/robot.glb?X-Amz-Signature=abc";
        routes[signed] = () => respond(200, glb({}));
        const sign = jest.fn(async (url: string) => (url === OTHER ? signed : null));

        expect(await probeModel(OTHER, { sign })).toMatchObject({ reach: "ok" });
        expect(fetchMock.mock.calls[0][0]).toBe(signed);

        expect(await probeModel("dropbox:/Models/robot.glb", { sign })).toEqual({ reach: "skipped" });
        expect(await probeModel("dropbox:/Models/robot.glb")).toEqual({ reach: "skipped" });
        expect(await probeModel("data:model/gltf-binary;base64,AAAA")).toEqual({ reach: "skipped" });
        expect(await probeModel(OTHER, { sign: async () => { throw new Error("x"); } })).toEqual({ reach: "skipped" });
    });

    test("signed .gltf siblings are not checked (they carry no signature)", async () => {
        const signed = "https://bucket.s3.test/scene/model.gltf?X-Amz-Signature=abc";
        routes[signed] = () => respond(200, enc(JSON.stringify(fixture("missing-bin"))));
        const facts = await probeModel("https://bucket.s3.test/scene/model.gltf", { sign: async () => signed });
        expect(facts.missingSiblings).toBeUndefined();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    test("a timeout is unknown, never unreachable", async () => {
        fetchMock.mockImplementation((_url: string, init: any) => new Promise((_resolve, reject) => {
            init.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }));
        expect(await probeModel(OTHER, { timeoutMs: 5 })).toEqual({ reach: "unknown" });
    });
});

describe("siblingUrls", () => {
    test("resolves relative URIs, skips data:, dedupes", () => {
        expect(siblingUrls(fixture("missing-bin"), "https://a.test/x/model.gltf?v=2")).toEqual([
            "https://a.test/x/scene.bin",
            "https://a.test/x/textures/wood.png",
        ]);
    });

    test("skips absolute, protocol-relative, root-relative and out-of-folder URIs", () => {
        const json = {
            buffers: [
                { uri: "https://intranet.local/x" },
                { uri: "//evil.test/a.bin" },
                { uri: "/wp-admin/admin-post.php?action=foo" },
                { uri: "../../wp-admin/admin-post.php?action=foo" },
                { uri: "\\evil.test\\a.bin" },
                { uri: "javascript:alert(1)" },
                { uri: "ok.bin" },
            ],
        };
        expect(siblingUrls(json, "https://a.test/x/model.gltf")).toEqual(["https://a.test/x/ok.bin"]);
    });
});

describe("healthKey", () => {
    test("Drive files that differ only by id= get different keys", () => {
        expect(healthKey("https://drive.google.com/uc?export=download&id=A")).not.toBe(healthKey("https://drive.google.com/uc?export=download&id=B"));
    });

    test("a re-signed S3 URL keeps its key; scheme and param order don't matter", () => {
        const a = "https://bucket.s3.amazonaws.com/m.glb?X-Amz-Date=1&X-Amz-Signature=aaa&X-Amz-Expires=300&v=2";
        const b = "http://BUCKET.s3.amazonaws.com/m.glb?v=2&X-Amz-Signature=bbb&X-Amz-Date=2";
        expect(healthKey(a)).toBe(healthKey(b));
        expect(healthKey(a)).toBe("bucket.s3.amazonaws.com/m.glb?v=2");
    });

    test("Azure SAS names are stripped only when the URL carries sig", () => {
        expect(healthKey("https://a.blob.core.windows.net/c/m.glb?sv=1&se=2&sp=r&sig=x")).toBe("a.blob.core.windows.net/c/m.glb");
        expect(healthKey("https://a.test/get.php?sp=7&f=m.glb")).toBe("a.test/get.php?f=m.glb&sp=7");
    });

    test("script endpoints keep their query; custom schemes stay as they are", () => {
        expect(healthKey("https://a.test/get.php?f=a.glb")).not.toBe(healthKey("https://a.test/get.php?f=b.glb"));
        expect(healthKey("dropbox:/Models/robot.glb#x")).toBe("dropbox:/Models/robot.glb");
        expect(healthKey("")).toBe("");
    });
});

describe("mediaLibrarySize", () => {
    test("reads filesizeInBytes of a loaded attachment, ignoring scheme and query", () => {
        const models = [{ get: (key: string) => ({ url: "https://dev.local/wp-content/uploads/robot.glb", filesizeInBytes: 1234 } as any)[key] }];
        (window as any).wp = { media: { model: { Attachments: { all: { find: (fn: any) => models.find(fn) } } } } };
        expect(mediaLibrarySize("http://dev.local/wp-content/uploads/robot.glb?v=1")).toBe(1234);
        expect(mediaLibrarySize("https://dev.local/wp-content/uploads/other.glb")).toBe(0);
    });

    test("no media frame → 0", () => {
        expect(mediaLibrarySize(SAME)).toBe(0);
    });
});
