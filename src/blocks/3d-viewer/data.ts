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

export const modelViewers = (placement: string): ViewerOption[] => {
    if (placement === 'visual-editor') {
        return [
            { label: 'Support only .glb, .glTF', value: 'modelViewer', icon: 'Lite' },
        ];
    } else {
        return [
            { label: 'Support only .glb, .glTF', value: 'modelViewer', icon: 'Lite' },
            {
                label: 'Support .obj, .3ds, .stl, .ply, .gltf, .off, .3dm, .fbx, .dae, .wrl, .3mf, amf, ifc, .step, .iges, .fcstd, and .bim  file types',
                value: 'O3DViewer',
                icon: 'Advanced',
            },
        ];
    }
};
