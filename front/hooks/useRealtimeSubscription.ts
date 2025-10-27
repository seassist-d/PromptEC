import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onDataChange?: (payload: any) => void;
  onNewRecord?: (payload: any) => void;
  onUpdateRecord?: (payload: any) => void;
  onDeleteRecord?: (payload: any) => void;
}

export function useRealtimeSubscription({
  table,
  event = '*',
  onDataChange,
  onNewRecord,
  onUpdateRecord,
  onDeleteRecord,
}: UseRealtimeSubscriptionOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // コールバックをrefで保持して無限ループを防ぐ
  const onDataChangeRef = useRef(onDataChange);
  const onNewRecordRef = useRef(onNewRecord);
  const onUpdateRecordRef = useRef(onUpdateRecord);
  const onDeleteRecordRef = useRef(onDeleteRecord);

  // コールバックを常に最新に保つ
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
    onNewRecordRef.current = onNewRecord;
    onUpdateRecordRef.current = onUpdateRecord;
    onDeleteRecordRef.current = onDeleteRecord;
  }, [onDataChange, onNewRecord, onUpdateRecord, onDeleteRecord]);

  useEffect(() => {
    const supabase = createClient();
    
    // チャネルを作成
    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        {
          event: event as any,
          schema: 'public',
          table: table,
        },
        (payload) => {
          console.log('Realtime event:', payload.eventType, payload);
          
          // 汎用コールバック
          onDataChangeRef.current?.(payload);
          
          // イベント別コールバック
          switch (payload.eventType) {
            case 'INSERT':
              onNewRecordRef.current?.(payload);
              break;
            case 'UPDATE':
              onUpdateRecordRef.current?.(payload);
              break;
            case 'DELETE':
              onDeleteRecordRef.current?.(payload);
              break;
          }
        }
      )
      .subscribe((status) => {
        // デバッグログを減らす（SUBSCRIBED/CLOSEDのみログ出力）
        if (status === 'SUBSCRIBED' || status === 'CLOSED') {
          console.log('Subscription status:', status);
        }
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, event]); // コールバックを依存配列から削除

  return { isConnected };
}

