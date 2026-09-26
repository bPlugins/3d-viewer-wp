import { config } from './config';

interface AjaxDeferred {
    done: (cb: (res: unknown) => void) => AjaxDeferred;
    fail: (cb: (err: unknown) => void) => AjaxDeferred;
}

type WpGlobal = {
    wp?: { ajax?: { post: (action: string, data: Record<string, string | number>) => AjaxDeferred } };
};

export const STEP_TOTAL = 3;

/**
 * Record that the user left the wizard from `stepIndex` (zero-based), then run
 * `after` whichever way the request goes — progress must never block navigation.
 * Same payload the bpl-tools wizard posted, read by BP3D\Base\Onboarding::save().
 */
export const saveProgress = (stepIndex: number, after: () => void): void => {
    let done = false;
    const once = () => {
        if (done) return;
        done = true;
        after();
    };

    const { ajaxAction, nonce } = config();
    const ajax = (window as unknown as WpGlobal).wp?.ajax;

    if (!ajax || !ajaxAction) {
        once();
        return;
    }

    ajax.post(ajaxAction, {
        nonce,
        stepIndex,
        stepTotal: STEP_TOTAL,
        completed: '1',
        finished: stepIndex === STEP_TOTAL - 1 ? '1' : '0',
    })
        .done(once)
        .fail(once);

    // Never strand the user if the request hangs.
    window.setTimeout(once, 4000);
};
