import ModelHealthNotice from './ModelHealthNotice';
import useSpecGlossCheck from '../hooks/useSpecGlossCheck';
import type { FindingId } from '../utils/health/types';

interface EditorHealthNoticeProps {
    modelUrl?: string;
    currentViewer?: string;
}

const isAbsoluteUrl = (url?: string): boolean => {
    try {
        return !!url && !!new URL(url);
    } catch {
        return false;
    }
};

/** The block editor's basic health check (free). Edit.tsx draws SpecGlossNotice for a valid URL, so H14 waits on it. */
const EditorHealthNotice = ({ modelUrl, currentViewer }: EditorHealthNoticeProps) => {
    const viewer = currentViewer || 'modelViewer';
    const specGloss = useSpecGlossCheck(viewer === 'modelViewer' && isAbsoluteUrl(modelUrl) ? modelUrl : undefined);
    const suppress: FindingId[] = specGloss === 'checking' || specGloss === 'specgloss' ? ['H14'] : [];

    return <ModelHealthNotice modelUrl={modelUrl} currentViewer={viewer} variant='free' suppress={suppress} />;
};

export default EditorHealthNotice;
