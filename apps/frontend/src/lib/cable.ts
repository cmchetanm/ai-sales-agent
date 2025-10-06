import * as ActionCable from '@rails/actioncable';

export type Cable = ReturnType<typeof ActionCable.createConsumer>;

export function createCable(): Cable {
  const base = (import.meta as any).env?.VITE_CABLE_URL || ((import.meta as any).env?.VITE_BACKEND_URL || 'http://localhost:3000').replace(/^http/, 'ws') + '/cable';
  return ActionCable.createConsumer(base);
}

