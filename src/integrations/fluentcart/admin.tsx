import { createElement, createRoot, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Button, Notice, SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { FormSkeleton } from './skeleton';
import { SaveBar } from './saveBar';
import './admin.scss';

/**
 * The "3D Model" tab in FluentCart's product editor, the same form as Pro's basic tier.
 * Adds a child route to FluentCart's router, reads bp3dFluentCart (AdminPage.php), saves through Rest.php.
 */

type Viewer = 'modelViewer' | 'O3DViewer';

interface Values {
    viewer: Viewer;
    model: string;
    poster: string;
    position: string;
    showFirst: boolean;
    background: string;
    height: number;
}

/** Form state: the height may be empty while the user retypes it; Save sends a number. */
type FormValues = Omit<Values, 'height'> & { height: number | '' };

interface Config {
    tier: 'basic';
    routeName: string;
    routePath: string;
    restUrl: string;
    nonce: string;
    modelViewerSrc: string;
    positions: Record<string, string>;
    modelTypes: string[];
    modelExtensions: string[];
    heightDefault: number;
    heightMin: number;
    heightMax: number;
}

const config = (window as any).bp3dFluentCart as Config | undefined;

const LITE_EXTENSIONS = ['glb', 'gltf'];

const extensionOf = (url: string): string => {
    try {
        const path = new URL(url, window.location.href).pathname;
        const dot = path.lastIndexOf('.');
        return dot === -1 ? '' : path.slice(dot + 1).toLowerCase();
    } catch {
        return '';
    }
};

const loadModelViewer = (src: string) => {
    if (customElements.get('model-viewer') || document.getElementById('bp3d-fct-model-viewer')) return;
    const script = document.createElement('script');
    script.type = 'module';
    script.id = 'bp3d-fct-model-viewer';
    script.src = src;
    document.head.appendChild(script);
};

/* One wp.media frame per kind; the model one is filtered to 3D types, like the other model pickers. */
const pick = (kind: 'model' | 'image', types: string[]): Promise<string | null> =>
    new Promise((resolve) => {
        const media = (window as any).wp?.media;
        if (typeof media !== 'function') {
            resolve(null);
            return;
        }
        const frame = media({
            title: kind === 'model' ? __('Choose a 3D model', '3d-viewer') : __('Choose a poster image', '3d-viewer'),
            button: { text: __('Use this file', '3d-viewer') },
            multiple: false,
            library: { type: kind === 'model' ? types : 'image' },
        });
        let settled = false;
        frame.on('select', () => {
            settled = true;
            const raw = frame.state().get('selection')?.first()?.toJSON();
            resolve(typeof raw?.url === 'string' ? raw.url : null);
        });
        // wp.media fires "close" before "select"; defer so a selection wins.
        frame.on('close', () => window.setTimeout(() => !settled && resolve(null), 0));
        frame.open();
    });

const Preview = ({ values }: { values: FormValues }) => {
    if (!values.model) {
        return <p className="bp3d-fct-preview__note">{__('Pick a model file to see it here.', '3d-viewer')}</p>;
    }
    if (values.viewer !== 'modelViewer') {
        return <p className="bp3d-fct-preview__note">{__('The Advanced viewer has no preview here. Save, then open the product page.', '3d-viewer')}</p>;
    }
    return createElement('model-viewer', {
        src: values.model,
        poster: values.poster || undefined,
        'camera-controls': '',
        'shadow-intensity': '1',
        style: { width: '100%', height: `${values.height || 350}px`, background: values.background || 'transparent' },
    });
};

/** Unsaved edits, read by the route's leave guard. */
const dirtyProducts = new Set<number>();

/* Marks the product dirty for the route guard and warns before the page unloads. */
const useLeaveGuard = (productId: number, dirty: boolean) => {
    useEffect(() => {
        if (dirty) dirtyProducts.add(productId);
        else dirtyProducts.delete(productId);

        const warn = (event: BeforeUnloadEvent) => {
            if (!dirty) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => {
            window.removeEventListener('beforeunload', warn);
            dirtyProducts.delete(productId);
        };
    }, [dirty, productId]);
};

const request = async (url: string, init: RequestInit = {}) => {
    const response = await fetch(url, {
        credentials: 'same-origin',
        ...init,
        headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': config!.nonce, ...(init.headers || {}) },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(body?.message || sprintf(__('Request failed (HTTP %d).', '3d-viewer'), response.status));
    }
    return body;
};

const Form = ({ config, productId, initial }: { config: Config; productId: number; initial: Values }) => {
    const [saved, setSaved] = useState<FormValues>(initial);
    const [values, setValues] = useState<FormValues>(initial);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<{ status: 'success' | 'error'; text: string } | null>(null);
    const [dirty, setDirty] = useState(false);

    const set = (patch: Partial<FormValues>) => {
        setValues((current) => ({ ...current, ...patch }));
        setDirty(true);
        setNotice(null);
    };

    const extension = extensionOf(values.model);
    const lite = values.viewer === 'modelViewer';
    const extensionWarning = useMemo(() => {
        if (!values.model) return '';
        if (!extension || !config.modelExtensions.includes(extension)) {
            return sprintf(
                /* translators: %s: a list of file extensions */
                __('This does not look like a 3D model file. Accepted: %s.', '3d-viewer'),
                config.modelExtensions.map((ext) => '.' + ext).join(', ')
            );
        }
        if (lite && !LITE_EXTENSIONS.includes(extension)) {
            /* translators: %s: file extensions, e.g. ".obj, .fbx". */
            return sprintf(__('The Lite viewer opens only .glb and .gltf files, not %s.', '3d-viewer'), '.' + extension) + ' ' + __('Switch the 3D Viewer to Advanced.', '3d-viewer');
        }
        return '';
    }, [values.model, extension, lite, config.modelExtensions]);
    // The Advanced viewer has no loading poster; the image is then only the gallery thumbnail. Hidden values are kept.
    const showPoster = lite || values.position === 'thumb';

    useLeaveGuard(productId, dirty);

    const save = async () => {
        setSaving(true);
        setNotice(null);
        try {
            const body = await request(config.restUrl + productId, {
                method: 'POST',
                body: JSON.stringify({ ...values, height: values.height === '' ? config.heightDefault : values.height }),
            });
            setValues(body as Values);
            setSaved(body as Values);
            setDirty(false);
            setNotice({ status: 'success', text: __('Saved.', '3d-viewer') });
        } catch (error) {
            setNotice({ status: 'error', text: (error as Error).message });
        } finally {
            setSaving(false);
        }
    };

    const positions = Object.entries(config.positions).map(([value, label]) => ({ value, label }));

    return (
        <>
            {notice && <Notice status={notice.status} isDismissible onRemove={() => setNotice(null)}>{notice.text}</Notice>}

            <div className="bp3d-fct-admin__columns">
                <form
                    className="bp3d-fct-admin__form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void save();
                    }}
                >
                    <SelectControl
                        label={__('Viewer', '3d-viewer')}
                        value={values.viewer}
                        options={[
                            { value: 'modelViewer', label: __('Lite viewer (GLB, glTF)', '3d-viewer') },
                            { value: 'O3DViewer', label: __('Advanced viewer (OBJ, STL, FBX and more)', '3d-viewer') },
                        ]}
                        onChange={(viewer: string) => set({ viewer: viewer as Viewer })}
                        __nextHasNoMarginBottom
                    />

                    <div className="bp3d-fct-admin__picker">
                        <TextControl
                            label={__('Model file', '3d-viewer')}
                            value={values.model}
                            placeholder="https://…/model.glb"
                            onChange={(model: string) => set({ model: model.trim() })}
                            help={extensionWarning || __('A link to the file, or pick one from the Media Library.', '3d-viewer')}
                            className={extensionWarning ? 'has-warning' : undefined}
                            __nextHasNoMarginBottom
                        />
                        <Button variant="secondary" onClick={() => void pick('model', config.modelTypes).then((url) => url && set({ model: url }))}>
                            {__('Media Library', '3d-viewer')}
                        </Button>
                    </div>

                    {showPoster && (
                        <div className="bp3d-fct-admin__picker">
                            <TextControl
                                label={__('Poster image', '3d-viewer')}
                                value={values.poster}
                                placeholder="https://…/poster.jpg"
                                onChange={(poster: string) => set({ poster: poster.trim() })}
                                help={lite ? __('Shown while the model loads, and as the gallery thumbnail.', '3d-viewer') : __('Shown as the gallery thumbnail.', '3d-viewer')}
                                __nextHasNoMarginBottom
                            />
                            <Button variant="secondary" onClick={() => void pick('image', []).then((url) => url && set({ poster: url }))}>
                                {__('Media Library', '3d-viewer')}
                            </Button>
                        </div>
                    )}

                    <SelectControl
                        label={__('Position', '3d-viewer')}
                        value={values.position}
                        options={positions}
                        onChange={(position: string) => set({ position })}
                        help={__('Where the viewer sits on the product page.', '3d-viewer')}
                        __nextHasNoMarginBottom
                    />

                    {values.position === 'thumb' && (
                        <ToggleControl
                            label={__('Open on the 3D model', '3d-viewer')}
                            help={__('The model shows first; the product photos stay one thumbnail away.', '3d-viewer')}
                            checked={values.showFirst}
                            onChange={(showFirst: boolean) => set({ showFirst })}
                            __nextHasNoMarginBottom
                        />
                    )}

                    <div className="bp3d-fct-admin__row">
                        <TextControl
                            label={__('Background', '3d-viewer')}
                            value={values.background}
                            placeholder="transparent"
                            onChange={(background: string) => set({ background: background.trim() })}
                            help={__('transparent, a hex colour such as #f4f4f4, or rgb().', '3d-viewer')}
                            __nextHasNoMarginBottom
                        />
                        <TextControl
                            label={__('Height (px)', '3d-viewer')}
                            type="number"
                            min={config.heightMin}
                            max={config.heightMax}
                            value={String(values.height)}
                            onChange={(height: string) => set({ height: height.trim() === '' ? '' : Number(height) || config.heightDefault })}
                            help={__('Above, below or instead of the gallery. The thumbnail slot fills the gallery box.', '3d-viewer')}
                            __nextHasNoMarginBottom
                        />
                    </div>

                </form>

                <aside className="bp3d-fct-admin__preview bp3d-fct-preview">
                    <h3>{__('Preview', '3d-viewer')}</h3>
                    <Preview values={values} />
                </aside>
            </div>
            <SaveBar
                active={dirty || saving}
                saving={saving}
                canSave
                onDiscard={() => {
                    setValues(saved);
                    setDirty(false);
                    setNotice(null);
                }}
                onSave={() => void save()}
            />
        </>
    );
};

const App = ({ config, productId }: { config: Config; productId: number }) => {
    const [initial, setInitial] = useState<Values | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let live = true;
        setInitial(null);
        setError('');
        request(config.restUrl + productId)
            .then((body) => live && setInitial(body as Values))
            .catch((e: Error) => live && setError(e.message));
        return () => {
            live = false;
        };
    }, [productId]);

    return (
        <div className="fct-layout-width bp3d-fct-admin">
            <div className="fct-card">
                <div className="fct-card-header">
                    <div className="flex-1">
                        <h2 className="fct-card-header-title">{__('3D Model', '3d-viewer')}</h2>
                    </div>
                </div>
                <div className="bp3d-fct-admin__body">
                    {error && <Notice status="error" isDismissible={false}>{error}</Notice>}
                    {!error && !initial && <FormSkeleton />}
                    {initial && <Form key={productId} config={config} productId={productId} initial={initial} />}
                </div>
            </div>
        </div>
    );
};

/*
 * FluentCart's router takes Vue components and exposes no Vue to add-ons, so the route renders an
 * empty (comment) node and mounts the React form in a sibling element. The sibling goes before the
 * comment: Vue anchors its next insert on the node after it, which must not be ours.
 */
const routeComponent = (config: Config) => ({
    name: 'Bp3dFluentCartModel',
    props: ['product_id', 'product', 'taxonomies'],
    render(this: any) {
        void this.product_id;
        return null;
    },
    mounted(this: any) {
        // As FluentCart's own product tabs do: on a fresh load its header waits in the top menu holder.
        const header = document.querySelector('#fct_admin_menu_holder .fct-admin-product-header');
        const app = document.querySelector('#fluent_cart_plugin_app');
        if (header && app) app.prepend(header);

        loadModelViewer(config.modelViewerSrc);
        this.bp3dHost = document.createElement('div');
        this.$el.parentNode?.insertBefore(this.bp3dHost, this.$el);
        this.bp3dRoot = createRoot(this.bp3dHost);
        this.bp3dRender();
    },
    updated(this: any) {
        this.bp3dRender();
    },
    beforeUnmount(this: any) {
        this.bp3dRoot?.unmount();
        this.bp3dHost?.remove();
    },
    beforeRouteLeave(this: any, _to: unknown, _from: unknown, next: (go?: boolean) => void) {
        const id = Number(this.product_id);
        next(!dirtyProducts.has(id) || window.confirm(__('You have unsaved changes. Leave anyway?', '3d-viewer')));
    },
    methods: {
        bp3dRender(this: any) {
            const id = Number(this.product_id);
            this.bp3dRoot?.render(<App key={id} config={config} productId={id} />);
        },
    },
});

const hooks = (window as any).fluent_cart_admin?.hooks;
if (config && hooks) {
    hooks.addFilter('fluent_cart_routes', 'bp3d/fluentcart-model', (routes: any) => {
        const children = routes?.product_route?.children;
        if (Array.isArray(children) && !children.some((route: any) => route?.name === config.routeName)) {
            children.push({
                name: config.routeName,
                path: config.routePath,
                props: true,
                component: routeComponent(config),
                meta: { active_menu: 'products', title: __('3D Model', '3d-viewer'), permission: 'products/edit' },
            });
        }
        return routes;
    });
}
