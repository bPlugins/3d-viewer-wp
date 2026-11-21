import Notice from '../../../bpl-tools/Components/Notice';
import useModelHealth from '../hooks/useModelHealth';
import { editorView, type EditorViewOptions, type HealthView } from '../utils/health/messages';
import type { ProbeSigner } from '../utils/health/probe';
import HealthLines from './HealthLines';
import './ModelHealthNotice.scss';

export interface ModelHealthNoticeProps extends EditorViewOptions {
    /** A list in multiple-model mode; the findings merge into one notice. */
    modelUrl?: string | string[];
    currentViewer?: string;
    heavyBytes?: number;
    /** Pro passes signForProbe; free leaves it out. */
    sign?: ProbeSigner | null;
}

export const HealthViewNotice = ({ view }: { view: HealthView | null }) => {
    if (!view) return null;

    return (
        <Notice status={view.status} className='bp3dModelHealthNotice' isIcon>
            <HealthLines view={view} />
        </Notice>
    );
};

// Read-only, under the main model field beside BigFileNotice; writes no attribute.
const ModelHealthNotice = ({ modelUrl, currentViewer = 'modelViewer', variant, heavyBytes, sign, ...view }: ModelHealthNoticeProps) => {
    const { findings } = useModelHealth(modelUrl, { currentViewer, variant, heavyBytes, sign });

    return <HealthViewNotice view={editorView(findings, { ...view, variant })} />;
};

export default ModelHealthNotice;
