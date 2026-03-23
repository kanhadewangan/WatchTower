import {useQuery} from '@tanstack/react-query';
import axios  from 'axios';

export const useCustomQuery = (key, queryFn, options = {}) => {
    return useQuery({
        queryKey: key,
        queryFn,
        retry: 0, // Disable automatic retries
        refetchOnWindowFocus: false, // Disable refetching on window focus
        refetchOnReconnect: false, // Disable refetching on reconnect
        onError: (error) => {
            if (axios.isAxiosError(error)) {
                console.error('API Error:', error.response?.data || error.message);
            } else {
                console.error('Unexpected Error:', error);
            }
        },
        ...options
    });
}