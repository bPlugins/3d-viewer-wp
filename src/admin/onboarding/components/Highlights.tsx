import React from 'react';
import { __ } from '@wordpress/i18n';
import { BoxIcon, ZapIcon, GlobeIcon } from './icons';
import type { Method } from '../lib/config';

type Tone = 'green' | 'blue' | 'purple';

export interface Highlight {
    tone: Tone;
    Icon: React.FC<{ size?: number }>;
    title: string;
    body: string;
}

const TONES: Tone[] = ['green', 'blue', 'purple'];
const ICONS = [BoxIcon, ZapIcon, GlobeIcon];

const build = (pairs: Array<[string, string]>): Highlight[] =>
    pairs.map(([title, body], i) => ({ tone: TONES[i], Icon: ICONS[i], title, body }));

/** Step 1 — the copy the Figma frames were measured against. */
export const defaultHighlights = (): Highlight[] =>
    build([
        [__('Easy Setup', '3d-viewer'), __('Upload your 3D model and configure in minutes.', '3d-viewer')],
        [__('Interactive Experience', '3d-viewer'), __('Let your visitors rotate, zoom and explore.', '3d-viewer')],
        [__('Works Everywhere', '3d-viewer'), __('Built for WordPress, works on all devices.', '3d-viewer')],
    ]);

/** Step 3 — the three steps for whichever method the user picked. */
export const methodHighlights = (method: Method): Highlight[] => {
    if (method === 'elementor') {
        return build([
            // Titles must fit one line in a 162px column or the block grows and
            // shifts the footer; see the height assertion in the e2e spec.
            [__('Edit with Elementor', '3d-viewer'), __('Open any page in the editor.', '3d-viewer')],
            [__('Drag the widget', '3d-viewer'), __('Find Model Viewer in the widget panel.', '3d-viewer')],
            [__('Set the model file', '3d-viewer'), __('Pick a model and publish.', '3d-viewer')],
        ]);
    }

    if (method === 'shortcode') {
        return build([
            [__('Add a 3D model', '3d-viewer'), __('3D Viewer → Add New, then save.', '3d-viewer')],
            [__('Copy the shortcode', '3d-viewer'), __('Shown after saving the model.', '3d-viewer')],
            [__('Paste it anywhere', '3d-viewer'), __('Any post, page, widget or builder.', '3d-viewer')],
        ]);
    }

    return build([
        [__('Add the block', '3d-viewer'), __('Search for "3D Model Viewer" in the editor.', '3d-viewer')],
        [__('Paste the model URL', '3d-viewer'), __('Or upload a file from the Media Library.', '3d-viewer')],
        [__('Publish', '3d-viewer'), __('The viewer renders on the page.', '3d-viewer')],
    ]);
};

interface HighlightsProps {
    items?: Highlight[];
}

const Highlights: React.FC<HighlightsProps> = ({ items }) => {
    const list = items ?? defaultHighlights();

    return (
        <div className="bp3d-ob-highlights">
            {list.map(({ tone, Icon, title, body }) => (
                <div className="bp3d-ob-highlight" key={title}>
                    <span className={`bp3d-ob-highlight__icon bp3d-ob-highlight__icon--${tone}`}>
                        <Icon size={16} />
                    </span>
                    <h4 className="bp3d-ob-highlight__title">{title}</h4>
                    <p className="bp3d-ob-highlight__body">{body}</p>
                </div>
            ))}
        </div>
    );
};

export default Highlights;
