import { __ } from '@wordpress/i18n';
import type { CSSProperties, ReactNode } from 'react';

/* Placeholders shaped like the 3D Model tab, shown while its code or data loads. */

const Bone = ({ w = '100%', h = 14, r, className = '' }: { w?: number | string; h?: number; r?: number; className?: string }) => {
    const style: CSSProperties = { width: w, height: h };
    if (r !== undefined) style.borderRadius = r;
    return <span className={`bp3d-fct-skel__bone ${className}`.trim()} style={style} aria-hidden="true" />;
};

const Field = ({ label = 90, button = false, hints = [] }: { label?: number; button?: boolean; hints?: Array<number | string> }) => (
    <div className="bp3d-fct-skel__field">
        <Bone w={label} h={12} />
        <div className="bp3d-fct-skel__input">
            <Bone h={40} r={6} />
            {button && <Bone w={120} h={40} r={6} />}
        </div>
        {hints.map((w, i) => (
            <Bone key={i} w={w} h={11} />
        ))}
    </div>
);

const Status = ({ children }: { children: ReactNode }) => (
    <div className="bp3d-fct-skel" role="status" aria-busy="true">
        <span className="screen-reader-text">{__('Loading the 3D settings…', '3d-viewer')}</span>
        {children}
    </div>
);

export const PreviewSkeleton = () => <Bone className="bp3d-fct-skel__preview-bone" h={300} r={6} />;

/* The form: fields on the left, the preview card on the right. */
export const FormSkeleton = () => (
    <Status>
        <div className="bp3d-fct-admin__columns">
            <div className="bp3d-fct-skel__panel bp3d-fct-skel__panel--plain">
                <Field label={50} />
                <Field label={80} button hints={['55%']} />
                <Field label={90} button hints={['60%']} />
                <Field label={60} hints={['45%']} />
                <div className="bp3d-fct-skel__toggle">
                    <Bone w={32} h={18} r={9} />
                    <div className="bp3d-fct-skel__field">
                        <Bone w={130} h={13} />
                        <Bone w="75%" h={11} />
                    </div>
                </div>
                <div className="bp3d-fct-skel__row bp3d-fct-skel__row--form">
                    <Field label={80} hints={['70%']} />
                    <Field label={70} hints={['90%', '95%', '80%', '60%']} />
                </div>
                <Bone w={64} h={34} r={4} />
            </div>
            <div className="bp3d-fct-skel__preview">
                <Bone w={70} h={14} />
                <PreviewSkeleton />
            </div>
        </div>
    </Status>
);
