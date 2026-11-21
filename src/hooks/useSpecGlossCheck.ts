import { useEffect, useState } from 'react';
import { detectSpecGloss, SpecGlossVerdict } from '../utils/specGloss/detect';

export type SpecGlossStatus = 'idle' | 'checking' | SpecGlossVerdict;

const useSpecGlossCheck = (url?: string): SpecGlossStatus => {
    const [status, setStatus] = useState<SpecGlossStatus>('idle');

    useEffect(() => {
        if (!url) {
            setStatus('idle');
            return;
        }

        let cancelled = false;
        setStatus('checking');
        detectSpecGloss(url).then((verdict) => {
            if (!cancelled) setStatus(verdict);
        });

        return () => { cancelled = true; };
    }, [url]);

    return status;
};

export default useSpecGlossCheck;
