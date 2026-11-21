import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { PremiumBadge as BplPremiumBadge } from '../../../../../../bpl-tools/ProControls';
import { pricingUrl } from '../../../../utils/constant';

// bpl-tools ships this as untyped JS, so TS reads its default label as a literal type.
const PremiumBadge = BplPremiumBadge as unknown as React.ComponentType<{ label?: string; className?: string }>;

/**
 * Read-only "More in Pro" rows at the end of a panel (labels, never ghost controls). Dismissed per browser and
 * snoozed until the next free version, so an update shows them once more.
 */

export const SNOOZE_KEY = 'bp3d_more_in_pro';

const freeVersion = (): string => String((window as any).bp3dBlock?.version || '');

function readSnoozed(): Record<string, string> {
    try {
        const value = JSON.parse(window.localStorage.getItem(SNOOZE_KEY) || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
        return {};
    }
}

/** Without a known version a dismissal can't expire, so it lasts for this page view only. */
export const isSnoozed = (panel: string, version = freeVersion()): boolean => !!version && readSnoozed()[panel] === version;

export function snooze(panel: string, version = freeVersion()): void {
    if (!version) return;
    try {
        window.localStorage.setItem(SNOOZE_KEY, JSON.stringify({ ...readSnoozed(), [panel]: version }));
    } catch {
        // Private mode or blocked storage: hidden until the editor reloads.
    }
}

/** Only what Pro gates behind its licence; AR, shadow, environment image and skybox image are free. Lazy for wp-i18n. */
export const proItems = {
    model: (lite: boolean): string[] => [
        __('Multiple models, with thumbnails and arrows', '3d-viewer'),
        ...(lite ? [__('Textures', '3d-viewer'), __('Tone mapping', '3d-viewer'), __('Environment image as skybox', '3d-viewer')] : []),
    ],
    options: (): string[] => [
        __('Autoplay, variant and animation selectors', '3d-viewer'),
        __('Auto rotate, rotation locks and zoom level', '3d-viewer'),
        __('Control labels, placement and size', '3d-viewer'),
        __('Mobile options', '3d-viewer'),
        __('Dimensions, exploded view and hotspots', '3d-viewer'),
    ],
    advanced: (): string[] => [__('Show edges', '3d-viewer')],
    style: (): string[] => [__('Custom CSS, ID and class', '3d-viewer')],
};

interface MoreInProProps {
    /** Stable id per panel, the dismissal key. */
    panel: string;
    items: string[];
}

const MoreInPro = ({ panel, items }: MoreInProProps) => {
    const [hidden, setHidden] = useState(() => isSnoozed(panel));

    if (hidden || !items.length) return null;

    return (
        <div className='bp3dMoreInPro' role='group' aria-label={__('More in Pro', '3d-viewer')}>
            <div className='bp3dMoreInPro__head'>
                <span className='bp3dMoreInPro__title'>{__('More in Pro', '3d-viewer')}</span>
                <Button
                    className='bp3dMoreInPro__dismiss'
                    icon='no-alt'
                    size='small'
                    label={__('Hide until the next update', '3d-viewer')}
                    onClick={() => {
                        snooze(panel);
                        setHidden(true);
                    }}
                />
            </div>
            <ul className='bp3dMoreInPro__list'>
                {items.map((item) => (
                    <li key={item} className='bp3dMoreInPro__row'>
                        <span>{item}</span>
                        <a href={pricingUrl} target='_blank' rel='noopener noreferrer' aria-label={`${item}: ${__('available in Pro', '3d-viewer')}`}>
                            <PremiumBadge label={__('Pro', '3d-viewer')} />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MoreInPro;
