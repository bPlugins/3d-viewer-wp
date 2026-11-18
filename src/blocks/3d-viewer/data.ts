import { __ } from '@wordpress/i18n';
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
            { label: __('GLB and glTF, every feature', '3d-viewer'), value: 'modelViewer', icon: 'Lite' },
        ];
    } else {
        return [
            { label: __('GLB and glTF, every feature', '3d-viewer'), value: 'modelViewer', icon: 'Lite' },
            {
                label: __('OBJ, STL, FBX, STEP and 14 more, fewer features', '3d-viewer'),
                value: 'O3DViewer',
                icon: 'Advanced',
            },
        ];
    }
};
