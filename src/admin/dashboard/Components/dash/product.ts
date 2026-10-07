import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import FS from '../../../../../../bpl-tools/Admin/lib/fs';

export type Cycle = 'monthly' | 'annual' | 'lifetime';

export interface PlanPrice {
    licenses: number | null;
    monthly?: number | string;
    annual?: number | string;
    lifetime?: number | string;
}

export interface Plan {
    id: number | string;
    name: string;
    title: string;
    description?: string;
    pricing?: PlanPrice[];
    features?: { title: string }[];
}

export interface Product {
    id: number | string;
    public_key: string;
    title: string;
    icon?: string;
    money_back_period?: number;
    plans?: Plan[];
}

// Same live Freemius catalogue the previous Pricing and Feature Comparison screens read.
let request: Promise<Product | null> | null = null;
const fetchProduct = (id: number): Promise<Product | null> => {
    request = request || fetch(`https://api.bplugins.com/wp-json/bpl/v1/products/${id}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    return request;
};

export const useProduct = (id: number) => {
    const [state, setState] = useState<{ loading: boolean; product: Product | null }>({ loading: true, product: null });

    useEffect(() => {
        let alive = true;
        fetchProduct(id).then((product) => {
            if (!alive) return;
            if (!product) request = null; // let a revisit retry
            setState({ loading: false, product: product?.id ? product : null });
        });
        return () => { alive = false; };
    }, [id]);

    return state;
};

export const num = (v: unknown): number => (typeof v === 'number' ? v : parseFloat(String(v)));

export const money = (v: number): string => (Number.isInteger(v) ? String(v) : v.toFixed(2));

/* Yearly vs twelve monthly payments, from the single-site row. */
export const annualSaving = (plan?: Plan): number => {
    const one = plan?.pricing?.find((p) => p.licenses === 1) || plan?.pricing?.[0];
    const monthly = num(one?.monthly) * 12;
    const annual = num(one?.annual);
    return monthly > 0 && annual > 0 ? Math.round(((monthly - annual) / monthly) * 100) : 0;
};

export const cyclesOf = (plan?: Plan): Cycle[] => {
    const one = plan?.pricing?.[0];
    return (['monthly', 'annual', 'lifetime'] as Cycle[]).filter((c) => one && one[c] !== undefined && one[c] !== null);
};

export const cycleLabel = (c: Cycle): string => ({
    monthly: __('Monthly', '3d-viewer'),
    annual: __('Yearly', '3d-viewer'),
    lifetime: __('Lifetime', '3d-viewer'),
}[c]);

export const openCheckout = (product: Product, plan: Plan, licenses: number | null, cycle: Cycle, extra: Record<string, unknown> = {}) => {
    new (FS as any).Checkout({
        plugin_id: product.id,
        plan_id: plan.id,
        public_key: product.public_key,
    }).open({ licenses, billing_cycle: cycle, ...extra });
};

const decode = (html: string): string => {
    const el = document.createElement('textarea');
    el.innerHTML = html.replace(/<[^>]+>/g, '');
    return el.value;
};

export const featureKey = (title: string): string => decode(title).toLowerCase().replace(/[^a-z0-9]/g, '');

export const featureText = (title: string): string => decode(title);
