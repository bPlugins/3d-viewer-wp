import { openPicker, pickerText } from './media';
import { bp3dGlobals } from './types';
import type { FileField, MediaPick } from './types';
import { DEFAULT_EXTENSIONS, FILE_FIELDS } from './validate';

const config = (): Record<string, any> => bp3dGlobals().bp3dDokan || {};

const fieldName = (field: HTMLElement): FileField | null => {
    const name = field.getAttribute('data-bp3d-field') as FileField;
    return FILE_FIELDS.includes(name) ? name : null;
};

const fieldExts = (field: HTMLElement, name: FileField): string[] => {
    const own = (field.getAttribute('data-bp3d-ext') || '').toLowerCase().split(/[\s,|]+/).filter(Boolean);
    if (own.length) {
        return own;
    }
    const configured = config().extensions?.[name];
    return Array.isArray(configured) && configured.length ? configured.map(String) : DEFAULT_EXTENSIONS[name];
};

const clearError = (field: HTMLElement): void => {
    field.querySelectorAll('.bp3d-dokan-error').forEach((el) => el.remove());
};

const showError = (field: HTMLElement, message: string): void => {
    clearError(field);
    const alert = document.createElement('div');
    alert.className = 'dokan-alert dokan-alert-danger bp3d-dokan-error';
    alert.setAttribute('role', 'alert');
    alert.textContent = message;
    const picker = field.querySelector('.bp3d-dokan-picker');
    if (picker) {
        picker.insertAdjacentElement('afterend', alert);
    } else {
        field.appendChild(alert);
    }
};

const renderPreview = (root: HTMLElement): void => {
    const preview = root.querySelector<HTMLElement>('.bp3d-dokan-preview');
    if (!preview) {
        return;
    }
    const src = preview.getAttribute('data-src') || '';
    const poster = preview.getAttribute('data-poster') || '';
    const defined = typeof window.customElements !== 'undefined' && !!window.customElements.get('model-viewer');

    while (preview.firstChild) {
        preview.removeChild(preview.firstChild);
    }

    if (src && defined) {
        const viewer = document.createElement('model-viewer');
        viewer.setAttribute('src', src);
        if (poster) {
            viewer.setAttribute('poster', poster);
        }
        viewer.setAttribute('camera-controls', '');
        viewer.setAttribute('alt', '');
        viewer.className = 'bp3d-dokan-preview__viewer';
        preview.appendChild(viewer);
    } else if (poster) {
        const img = document.createElement('img');
        img.src = poster;
        img.alt = '';
        img.className = 'bp3d-dokan-preview__poster';
        preview.appendChild(img);
    }
    preview.classList.toggle('has-preview', !!(src || poster));

    if (src && !defined && typeof window.customElements !== 'undefined' && preview.getAttribute('data-bp3d-waiting') !== '1') {
        preview.setAttribute('data-bp3d-waiting', '1');
        window.customElements.whenDefined('model-viewer').then(() => renderPreview(root));
    }
};

const applyValue = (root: HTMLElement, field: HTMLElement, name: FileField, pick: MediaPick | null): void => {
    const picker = field.querySelector<HTMLElement>('.bp3d-dokan-picker');
    const input = picker?.querySelector<HTMLInputElement>('.bp3d-dokan-input');
    if (!picker || !input) {
        return;
    }
    const nameEl = picker.querySelector('.bp3d-dokan-picker__name');
    const valueEl = picker.querySelector('.bp3d-dokan-picker__value');
    let thumb = picker.querySelector<HTMLImageElement>('.bp3d-dokan-picker__thumb');

    if (pick) {
        input.value = String(pick.id);
        picker.classList.add('has-value');
        if (nameEl) {
            nameEl.textContent = pick.filename || pick.url.substring(pick.url.lastIndexOf('/') + 1);
        }
        if (name === 'poster' && valueEl) {
            if (!thumb) {
                thumb = document.createElement('img');
                thumb.className = 'bp3d-dokan-picker__thumb';
                thumb.alt = '';
                valueEl.insertBefore(thumb, valueEl.firstChild);
            }
            thumb.src = pick.url;
        }
    } else {
        // Nothing stored originally: "remove" just undoes the pick.
        input.value = picker.getAttribute('data-bp3d-initial') === '1' ? '0' : 'keep';
        picker.classList.remove('has-value');
        if (nameEl) {
            nameEl.textContent = '';
        }
        thumb?.removeAttribute('src');
    }

    const preview = root.querySelector<HTMLElement>('.bp3d-dokan-preview');
    if (preview && (name === 'model' || name === 'poster')) {
        preview.setAttribute(name === 'model' ? 'data-src' : 'data-poster', pick ? pick.url : '');
        renderPreview(root);
    }
};

const syncBackground = (root: HTMLElement, target: HTMLInputElement): void => {
    const group = target.closest<HTMLElement>('.bp3d-dokan-background');
    const color = group?.querySelector<HTMLInputElement>('.bp3d-dokan-background__color');
    const transparent = group?.querySelector<HTMLInputElement>('.bp3d-dokan-background__transparent');
    if (!color || !transparent) {
        return;
    }
    // Picking a color means "not transparent".
    if (target === color) {
        transparent.checked = false;
    }
    color.classList.toggle('is-transparent', transparent.checked);
    const preview = root.querySelector<HTMLElement>('.bp3d-dokan-preview');
    if (preview) {
        preview.style.backgroundColor = transparent.checked ? '' : color.value;
    }
};

const choose = (root: HTMLElement, field: HTMLElement, name: FileField): void => {
    clearError(field);
    const kind = field.getAttribute('data-bp3d-kind') === 'image' || name === 'poster' ? 'image' : 'model';
    openPicker({
        ...pickerText(name),
        ext: fieldExts(field, name),
        kind,
        maxBytes: Number(config().maxBytes) || 0,
        onError: (message) => showError(field, message),
    }).then((file) => {
        if (file) {
            applyValue(root, field, name, file);
        }
    });
};

const onClick = (root: HTMLElement, event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const action = target?.closest<HTMLElement>('.bp3d-dokan-pick, .bp3d-dokan-replace, .bp3d-dokan-remove');
    const field = action?.closest<HTMLElement>('.bp3d-dokan-field');
    const name = field ? fieldName(field) : null;
    if (!action || !field || !name || !root.contains(field)) {
        return;
    }
    event.preventDefault();

    if (action.classList.contains('bp3d-dokan-remove')) {
        clearError(field);
        applyValue(root, field, name, null);
        field.querySelector<HTMLElement>('.bp3d-dokan-pick')?.focus();
        return;
    }
    choose(root, field, name);
};

export const initClassic = (root: HTMLElement): void => {
    if (root.getAttribute('data-bp3d-ready') === '1') {
        return;
    }
    root.setAttribute('data-bp3d-ready', '1');

    root.querySelectorAll<HTMLElement>('.bp3d-dokan-picker').forEach((picker) => {
        picker.setAttribute('data-bp3d-initial', picker.classList.contains('has-value') ? '1' : '0');
    });
    root.addEventListener('click', (event) => onClick(root, event));
    root.addEventListener('input', (event) => {
        if (event.target instanceof HTMLInputElement && event.target.closest('.bp3d-dokan-background')) {
            syncBackground(root, event.target);
        }
    });
    root.addEventListener('change', (event) => {
        if (event.target instanceof HTMLInputElement && event.target.closest('.bp3d-dokan-background')) {
            syncBackground(root, event.target);
        }
    });
    renderPreview(root);
    const transparent = root.querySelector<HTMLInputElement>('.bp3d-dokan-background__transparent');
    if (transparent) {
        syncBackground(root, transparent);
    }
};
