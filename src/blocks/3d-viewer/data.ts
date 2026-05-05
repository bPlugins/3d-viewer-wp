export interface SelectOption {
    label: string;
    value: string;
}

export interface ViewerOption extends SelectOption {
    icon: string;
}

export const defaultEnvironmentImages: SelectOption[] = [
    {
        label: 'Neutral',
        value: '',
    },
    {
        label: 'Legacy',
        value: 'legacy',
    },
];

export const toneMappings: SelectOption[] = [
    {
        label: 'Neutral',
        value: 'neutral',
    },
    {
        label: 'ACES',
        value: 'aces',
    },
    {
        label: 'agX',
        value: 'agx',
    },
];

export const textureChannels: SelectOption[] = [
    {
        label: 'Base Color',
        value: 'baseColor',
    },
    {
        label: 'Metallic Roughness',
        value: 'metallicRoughness',
    },
    {
        label: 'Normal Map',
        value: 'normal',
    },
    {
        label: 'Emissive',
        value: 'emissive',
    },
    {
        label: 'Occlusion',
        value: 'occlusion',
    },
];

export const modelViewers = (placement: string): ViewerOption[] => {
    if (placement === 'visual-editor') {
        return [
            { label: 'Support only .glb, .glTF', value: 'modelViewer', icon: 'Lite' },
        ];
    } else {
        return [
            { label: 'Support only .glb, .glTF', value: 'modelViewer', icon: 'Lite' },
            {
                label: 'Support .obj, .3ds, .stl, .ply, .gltf, .off, .3dm, .fbx, .dae, .wrl, .3mf, amf, ifc, .brep, .step, .iges, .fcstd, and .bim  file types',
                value: 'O3DViewer',
                icon: 'Advanced',
            },
        ];
    }
};
