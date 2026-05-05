import { useState, useEffect } from 'react';

const useWPAjax = <T>(action: string, params = {}, set = true) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState<T | null>(null);

    if (!wp.ajax) {
        // eslint-disable-next-line no-console
        console.error('Please use wp-util as a dependency');
        return { data: null as T | null, saveData: () => { }, refetch: () => { }, isLoading: false, isError: true, error: null };
    }

    const sendRequest = (payload = {}) => {
        setIsLoading(true);
        setIsError(false);
        setError(null);
        wp.ajax
            .post(action, { ...params, ...payload })
            .done((res: any) => {
                setIsLoading(false);
                setData(res);
            })
            .fail((error: any) => {
                setIsLoading(false);
                setIsError(true);
                setError(error);
            });
    }

    const request = (payload = {}) => {
        sendRequest(payload);
    }

    useEffect(() => {
        if (set) {
            sendRequest(params);
        }
    }, [set]);

    return { data, saveData: request, refetch: request, isLoading, isError, error }
}
export default useWPAjax;