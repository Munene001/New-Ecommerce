// lib/hooks/useShopOwnerTracking.ts
'use client';

import { useCallback } from 'react';

export function useShopOwnerTracking() {
    const track = useCallback((eventType: string) => {
        fetch('/api/tracking/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_type: eventType })
        }).catch(() => {});
    }, []);

    return { track };
}