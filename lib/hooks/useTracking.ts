'use client';

import { useCallback } from 'react';

interface TrackLeadOptions {
    shopId: number;
    eventType: string;
    metadata?: Record<string, any>;
}

export function useLeadTracking() {
    const track = useCallback((shopId: number, eventType: string, metadata: Record<string, any> = {}) => {
       
        if (!shopId || !eventType) {
            console.warn('Missing shopId or eventType');
            return;
        }

        const data = JSON.stringify({
            shop_id: shopId,
            event_type: eventType,
            metadata
        });

        // Use sendBeacon for guaranteed delivery (even on page unload)
        if (navigator.sendBeacon) {
            const blob = new Blob([data], { type: 'application/json' });
            navigator.sendBeacon('/api/tracking/shoplead', blob);
        } else {
            // Fallback to fetch
            fetch('/api/tracking/shoplead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: data,
                keepalive: true
            }).catch(() => {});
        }
    }, []);

    return { track };
}