// Media-library filter for model pickers; mirrors Utils::modelLibraryTypes(). `model` covers model/*,
// so gltf+json and usdz variants show too. A frame with `model` here also refuses other uploads (ExtendMimeType).
export const MODEL_MEDIA_TYPES = [
    "model",
    "application/x-3ds",
    "application/step",
    "application/vnd.ms-pki.stl",
    "application/octet-stream",
    "text/vnd.in3d.3dml",
    "application/collada+xml",
    "application/vnd.ms-3mfdocument",
];
