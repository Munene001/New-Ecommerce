// lib/hooks/useShopTracking.ts
import { useState, useEffect, useMemo } from 'react';

// ============ TYPES ============

interface Session {
  session_id: string;
  start_time: string;
  last_activity: string;
  ip_address: string;
  referrer_url: string;
  shop_view: number;
  product_view: number;
  whatsapp_click: number;
  phone_click: number;
  add_to_cart: number;
  checkout_page_view: number;
  order_placed: number;
  payment_success: number;
  status: string;
  [key: string]: any;
}

interface FunnelData {
  shop_view: number;
  product_view: number;
  add_to_cart: number;
  checkout_page_view: number;
  order_placed: number;
  payment_success: number;
}

interface EngagementData {
  whatsapp_click: { clicks: number; sessions: number };
  phone_click: { clicks: number; sessions: number };
}

interface StatsData {
  totalVisitors: number;
  completedPurchases: number;
  returningVisitors: number;
  ordersPlaced: number;
}

interface ApiResponse {
  success: boolean;
  shop: { shop_id: number; shop_name: string; shop_slug: string };
  date_range: { days: number; from: string };
  summary: { total_sessions: number; completed_sessions: number; conversion_rate: string };
  funnel: FunnelData;
  engagement: EngagementData;
  sessions: Session[];
  available_event_types: string[];
}

// ============ HELPER FUNCTIONS ============

const filterByDateRange = (sessions: Session[], days: number): Session[] => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return sessions.filter(session => new Date(session.last_activity) >= cutoff);
};

const aggregateEventCounts = (session: Session): Partial<Session> => {
  const result: any = {};
  const excludeKeys = ['session_id', 'start_time', 'last_activity', 'ip_address', 'referrer_url', 'status'];
  
  Object.keys(session).forEach(key => {
    if (!excludeKeys.includes(key) && typeof session[key] === 'number') {
      result[key] = session[key];
    }
  });
  
  return result;
};

const addEventCounts = (target: any, source: Session): void => {
  const excludeKeys = ['session_id', 'start_time', 'last_activity', 'ip_address', 'referrer_url', 'status'];
  
  Object.keys(source).forEach(key => {
    if (!excludeKeys.includes(key) && typeof source[key] === 'number') {
      target[key] = (target[key] || 0) + source[key];
    }
  });
};

const groupByIpAddress = (sessions: Session[]): any[] => {
  const ipMap = new Map();
  
  sessions.forEach(session => {
    const ip = session.ip_address;
    
    if (!ipMap.has(ip)) {
      ipMap.set(ip, {
        ip_address: ip,
        session_count: 1,
        first_visit: session.start_time,
        last_visit: session.last_activity,
        referrer_url: session.referrer_url,
        status: session.status,
        ...aggregateEventCounts(session)
      });
    } else {
      const existing = ipMap.get(ip);
      existing.session_count++;
      existing.last_visit = session.last_activity;
      addEventCounts(existing, session);
    }
  });
  
  return Array.from(ipMap.values());
};

// ============ MAIN HOOK ============

export function useShopTracking(shopId: number) {
  // ============ STATE ============
  const [rawData, setRawData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [dateRange, setDateRange] = useState(30);
  const [viewMode, setViewMode] = useState<'sessions' | 'ip'>('sessions');
  
  // ============ FETCH DATA ============
  useEffect(() => {
    if (!shopId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/admin/shops/${shopId}?days=90`);
        const data = await response.json();
        
        if (data.success) {
          setRawData(data);
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError('Network error: Failed to fetch analytics');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [shopId]);
  
  // ============ FILTER SESSIONS ============
  const filteredSessions = useMemo(() => {
    if (!rawData?.sessions || rawData.sessions.length === 0) return [];
    
    let sessions = filterByDateRange(rawData.sessions, dateRange);
    
    if (viewMode === 'ip') {
      sessions = groupByIpAddress(sessions);
    }
    
    return sessions;
  }, [rawData, dateRange, viewMode]);
  
  // ============ CALCULATE STATS ============
  const stats = useMemo((): StatsData => {
    const totalVisitors = filteredSessions.length;
    const completedPurchases = filteredSessions.filter(s => s.payment_success === 1).length;
    
    let returningVisitors = 0;
    if (viewMode === 'sessions') {
      const ipCounts: Record<string, number> = {};
      filteredSessions.forEach(s => {
        if (s.ip_address) {
          ipCounts[s.ip_address] = (ipCounts[s.ip_address] || 0) + 1;
        }
      });
      returningVisitors = Object.values(ipCounts).filter(count => count > 1).length;
    } else {
      returningVisitors = filteredSessions.filter(s => (s as any).session_count > 1).length;
    }
    
    const ordersPlaced = filteredSessions.filter(s => s.order_placed === 1).length;
    
    return {
      totalVisitors,
      completedPurchases,
      returningVisitors,
      ordersPlaced
    };
  }, [filteredSessions, viewMode]);
  
  // ============ CALCULATE FUNNEL ============
  const funnel = useMemo((): FunnelData => {
    if (viewMode === 'ip') {
      return {
        shop_view: filteredSessions.filter(s => (s.shop_view || 0) > 0).length,
        product_view: filteredSessions.filter(s => (s.product_view || 0) > 0).length,
        add_to_cart: filteredSessions.filter(s => (s.add_to_cart || 0) > 0).length,
        checkout_page_view: filteredSessions.filter(s => s.checkout_page_view === 1).length,
        order_placed: filteredSessions.filter(s => s.order_placed === 1).length,
        payment_success: filteredSessions.filter(s => s.payment_success === 1).length
      };
    }
    
    return {
      shop_view: filteredSessions.filter(s => s.shop_view > 0).length,
      product_view: filteredSessions.filter(s => s.product_view > 0).length,
      add_to_cart: filteredSessions.filter(s => s.add_to_cart > 0).length,
      checkout_page_view: filteredSessions.filter(s => s.checkout_page_view === 1).length,
      order_placed: filteredSessions.filter(s => s.order_placed === 1).length,
      payment_success: filteredSessions.filter(s => s.payment_success === 1).length
    };
  }, [filteredSessions, viewMode]);
  
  // ============ CALCULATE ENGAGEMENT ============
  const engagement = useMemo((): EngagementData => {
    const whatsappClicks = filteredSessions.reduce((sum, s) => sum + (s.whatsapp_click || 0), 0);
    const whatsappSessions = filteredSessions.filter(s => (s.whatsapp_click || 0) > 0).length;
    
    const phoneClicks = filteredSessions.reduce((sum, s) => sum + (s.phone_click || 0), 0);
    const phoneSessions = filteredSessions.filter(s => (s.phone_click || 0) > 0).length;
    
    return {
      whatsapp_click: { clicks: whatsappClicks, sessions: whatsappSessions },
      phone_click: { clicks: phoneClicks, sessions: phoneSessions }
    };
  }, [filteredSessions]);
  
  // ============ DYNAMIC EVENT TYPES ============
  const availableEventTypes = useMemo(() => {
    if (!rawData?.available_event_types) return [];
    return rawData.available_event_types;
  }, [rawData]);
  
  // ============ SHOP INFO ============
  const shopInfo = useMemo(() => {
    if (!rawData?.shop) return null;
    return rawData.shop;
  }, [rawData]);
  
  // ============ UPDATE FUNCTIONS ============
  const updateDateRange = (days: number) => setDateRange(days);
  const updateViewMode = (mode: 'sessions' | 'ip') => setViewMode(mode);
  const refresh = () => {
    setRawData(null);
    setLoading(true);
    setError(null);
    // The useEffect will re-run when shopId changes, but shopId is same
    // So manually trigger fetch by clearing and letting effect run
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/admin/shops/${shopId}?days=90`);
        const data = await response.json();
        if (data.success) {
          setRawData(data);
        } else {
          setError(data.error || 'Failed to fetch analytics');
        }
      } catch (err) {
        setError('Network error: Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  };
  
  // ============ RETURN ============
  return {
    stats,
    funnel,
    engagement,
    sessions: filteredSessions,
    availableEventTypes,
    shopInfo,
    dateRange,
    viewMode,
    updateDateRange,
    updateViewMode,
    refresh,
    loading,
    error
  };
}