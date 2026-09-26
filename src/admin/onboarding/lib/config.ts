/**
 * The `data-info` JSON printed by BP3DAdmin::render_setup_page() in inc/admin.php.
 */
export interface WizardUrls {
    addModel: string;
    addPage: string;
    dashboard: string;
    upgrade: string;
    tutorial: string;
}

export interface WizardConfig {
    isPremium: boolean;
    ajaxAction: string;
    nonce: string;
    dir: string;
    userName: string;
    hasElementor: boolean;
    urls: WizardUrls;
}

const EMPTY_URLS: WizardUrls = {
    addModel: '',
    addPage: '',
    dashboard: '',
    upgrade: '',
    tutorial: '',
};

let cached: WizardConfig | null = null;

export const config = (): WizardConfig => {
    if (cached) return cached;

    let raw: Partial<WizardConfig> = {};

    try {
        raw = JSON.parse(document.getElementById('bp3dOnboarding')?.dataset.info || '{}');
    } catch {
        raw = {};
    }

    cached = {
        isPremium: !!raw.isPremium,
        ajaxAction: raw.ajaxAction || '',
        nonce: raw.nonce || '',
        dir: raw.dir || '',
        userName: raw.userName || '',
        hasElementor: !!raw.hasElementor,
        urls: { ...EMPTY_URLS, ...(raw.urls || {}) },
    };

    return cached;
};

export const isPremium = (): boolean => config().isPremium;

export const hasElementor = (): boolean => config().hasElementor;

/** Absolute URL for a file shipped under the plugin's admin/ folder. */
export const asset = (path: string): string => config().dir + path.replace(/^\//, '');

export type Method = 'gutenberg' | 'elementor' | 'shortcode';

/**
 * Where "Add Your First 3D Model" goes. Elementor authors get a page, because
 * the widget carries its own fields and needs no CPT entry.
 */
export const methodTarget = (method: Method): string => {
    const { urls } = config();

    if (method === 'elementor' && hasElementor()) {
        return urls.addPage;
    }

    return urls.addModel;
};
