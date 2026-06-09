'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { DeviceCommand } from '@/lib/types';

const COMMAND_TIMEOUT_MS = 10000;

function waitForCommandCompletion(
  commandId: string,
  parentId: string
): Promise<DeviceCommand> {
  return new Promise((resolve, reject) => {
    const supabase = createClient();
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      supabase.removeChannel(channel);
      reject(new Error('DEVICE_ASLEEP'));
    }, COMMAND_TIMEOUT_MS);

    const channel = supabase
      .channel(`command-${commandId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'device_commands',
          filter: `id=eq.${commandId}`,
        },
        (payload) => {
          if (settled) return;
          const row = payload.new as DeviceCommand;
          if (row.status === 'completed' || row.status === 'failed') {
            settled = true;
            clearTimeout(timeout);
            supabase.removeChannel(channel);
            resolve(row);
          }
        }
      )
      .subscribe();

    supabase
      .from('device_commands')
      .select('*')
      .eq('id', commandId)
      .eq('parent_id', parentId)
      .single()
      .then(({ data }) => {
        if (settled || !data) return;
        const row = data as DeviceCommand;
        if (row.status === 'completed' || row.status === 'failed') {
          settled = true;
          clearTimeout(timeout);
          supabase.removeChannel(channel);
          resolve(row);
        }
      });
  });
}

export function useDeviceCommands(parentId: string | undefined) {
  const queryClient = useQueryClient();

  const gpsTrack = useMutation({
    mutationFn: async (deviceId: string) => {
      if (!parentId) throw new Error('Not authenticated');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('device_commands')
        .insert({
          parent_id: parentId,
          device_id: deviceId,
          command_type: 'GPS_TRACK',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      try {
        const result = await waitForCommandCompletion(data.id, parentId);
        return result;
      } catch (err) {
        if (err instanceof Error && err.message === 'DEVICE_ASLEEP') {
          await supabase
            .from('device_commands')
            .update({ status: 'cached', response_message: 'Awaiting device wake' })
            .eq('id', data.id);
          throw new Error(
            'Device currently asleep. Command cached for auto-execution when the phone meets next network connection.'
          );
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations', parentId] });
      queryClient.invalidateQueries({ queryKey: ['devices', parentId] });
    },
  });

  const healthCheck = useMutation({
    mutationFn: async (deviceId: string) => {
      if (!parentId) throw new Error('Not authenticated');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('device_commands')
        .insert({
          parent_id: parentId,
          device_id: deviceId,
          command_type: 'HEALTH_CHECK',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      try {
        const result = await waitForCommandCompletion(data.id, parentId);
        return result;
      } catch (err) {
        if (err instanceof Error && err.message === 'DEVICE_ASLEEP') {
          await supabase
            .from('device_commands')
            .update({ status: 'cached', response_message: 'Awaiting device wake' })
            .eq('id', data.id);
          throw new Error(
            'Device currently asleep. Command cached for auto-execution when the phone meets next network connection.'
          );
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices', parentId] });
    },
  });

  return { gpsTrack, healthCheck };
}
