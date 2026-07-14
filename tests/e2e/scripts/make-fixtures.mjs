#!/usr/bin/env node
/**
 * Generates the 3D model files used by the e2e suite (no binaries committed):
 *
 *   fixtures/e2e-cube.glb      minimal valid glTF 2.0 binary (a unit cube)
 *   fixtures/e2e-cube.stl      ASCII STL cube
 *   fixtures/e2e-cube.obj      Wavefront OBJ cube
 *   fixtures/e2e-evil.php.glb  same GLB bytes but with a double extension —
 *                              the plugin's upload hardening must defuse it
 *   fixtures/e2e-evil.glb.php  a PHP script — must be rejected outright
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures');
mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------- GLB (cube)
const positions = new Float32Array([
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, 0.5, -0.5,  -0.5, 0.5, -0.5,
    -0.5, -0.5,  0.5,  0.5, -0.5,  0.5,  0.5, 0.5,  0.5,  -0.5, 0.5,  0.5,
]);
const indices = new Uint16Array([
    0, 2, 1, 0, 3, 2, // back
    4, 5, 6, 4, 6, 7, // front
    0, 4, 7, 0, 7, 3, // left
    1, 2, 6, 1, 6, 5, // right
    0, 1, 5, 0, 5, 4, // bottom
    3, 7, 6, 3, 6, 2, // top
]);

const idxBytes = Buffer.from(indices.buffer); // 72 bytes (4-byte aligned)
const posBytes = Buffer.from(positions.buffer); // 96 bytes
const bin = Buffer.concat([idxBytes, posBytes]);

const gltf = {
    asset: { version: '2.0', generator: 'bplugins-3d-viewer-e2e' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 1 }, indices: 0, material: 0 }] }],
    materials: [
        {
            pbrMetallicRoughness: {
                baseColorFactor: [0.15, 0.45, 0.9, 1],
                metallicFactor: 0.1,
                roughnessFactor: 0.8,
            },
        },
    ],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: idxBytes.length, target: 34963 },
        { buffer: 0, byteOffset: idxBytes.length, byteLength: posBytes.length, target: 34962 },
    ],
    accessors: [
        { bufferView: 0, componentType: 5123, count: indices.length, type: 'SCALAR' },
        {
            bufferView: 1,
            componentType: 5126,
            count: positions.length / 3,
            type: 'VEC3',
            min: [-0.5, -0.5, -0.5],
            max: [0.5, 0.5, 0.5],
        },
    ],
};

function chunk(type, payload, pad) {
    const padded = Buffer.concat([
        payload,
        Buffer.alloc((4 - (payload.length % 4)) % 4, pad),
    ]);
    const header = Buffer.alloc(8);
    header.writeUInt32LE(padded.length, 0);
    header.writeUInt32LE(type, 4);
    return Buffer.concat([header, padded]);
}

const jsonChunk = chunk(0x4e4f534a, Buffer.from(JSON.stringify(gltf)), 0x20); // 'JSON', pad w/ spaces
const binChunk = chunk(0x004e4942, bin, 0x00); // 'BIN\0'
const glbHeader = Buffer.alloc(12);
glbHeader.writeUInt32LE(0x46546c67, 0); // magic 'glTF'
glbHeader.writeUInt32LE(2, 4); // version
glbHeader.writeUInt32LE(12 + jsonChunk.length + binChunk.length, 8);
const glb = Buffer.concat([glbHeader, jsonChunk, binChunk]);

writeFileSync(path.join(outDir, 'e2e-cube.glb'), glb);
writeFileSync(path.join(outDir, 'e2e-evil.php.glb'), glb); // double extension — must be stored defused
writeFileSync(path.join(outDir, 'e2e-evil.glb.php'), '<?php echo "pwned";'); // must be rejected outright

// ------------------------------------------------------ PNG (1×1, wp-core regression)
// A normal image upload must keep working while the plugin filters upload_mimes.
writeFileSync(
    path.join(outDir, 'e2e-image.png'),
    Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64'
    )
);

// ---------------------------------------------------------------- STL (cube)
const v = [
    [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
    [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5],
];
const faces = [
    [0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7], [0, 4, 7], [0, 7, 3],
    [1, 2, 6], [1, 6, 5], [0, 1, 5], [0, 5, 4], [3, 7, 6], [3, 6, 2],
];
let stl = 'solid e2ecube\n';
for (const [a, b, c] of faces) {
    stl += '  facet normal 0 0 0\n    outer loop\n';
    for (const i of [a, b, c]) stl += `      vertex ${v[i].join(' ')}\n`;
    stl += '    endloop\n  endfacet\n';
}
stl += 'endsolid e2ecube\n';
writeFileSync(path.join(outDir, 'e2e-cube.stl'), stl);

// ---------------------------------------------------------------- OBJ (cube)
let obj = '# e2e cube\n';
for (const p of v) obj += `v ${p.join(' ')}\n`;
for (const [a, b, c] of faces) obj += `f ${a + 1} ${b + 1} ${c + 1}\n`;
writeFileSync(path.join(outDir, 'e2e-cube.obj'), obj);

console.log(`Fixtures written to ${outDir}`);
console.log(`  e2e-cube.glb      ${glb.length} bytes`);
console.log('  e2e-cube.stl, e2e-cube.obj, e2e-evil.php.glb, e2e-evil.glb.php');
