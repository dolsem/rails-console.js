import type { ChildProcess } from 'child_process';
import { EventEmitter } from 'stream';

export type DataListener = (data: Buffer) => void;
export type ErrorListener = (err: Error) => void;
export type CloseListener = (code: number) => void;

export interface Listeners {
  'error'?: ErrorListener;
  'stdout:data'?: DataListener;
  'stderr:data'?: DataListener;
  'close'?: CloseListener;
}

const getEmitterAndEvent = (obj: EventEmitter, listenerKey: string) => {
  const split = listenerKey.split(':');
  const event = split.pop() as string;
  const emitterProp = split[0];
  const emitter: EventEmitter = emitterProp ? (obj as any)[emitterProp] : obj;
  return [emitter, event] as const;
};

export type CreateListeners<T> = (resolve: (value: T) => void, reject: (reason: any) => void) => Listeners;

export const listen = <T>(process: ChildProcess, cb: CreateListeners<T>) => new Promise<T>((pResolve, pReject) => {
  let listeners: Listeners;
  const attachListener = (listenerKey: string) => {
    const listener = listeners[listenerKey as keyof Listeners]!;
    const [emitter, event] = getEmitterAndEvent(process, listenerKey);
    emitter.on(event, listener);
  };
  const detachListener = (listenerKey: string) => {
    const listener = listeners[listenerKey as keyof Listeners]!;
    const [emitter, event] = getEmitterAndEvent(process, listenerKey);
    emitter.off(event, listener);
  };

  const resolve: typeof pResolve = (value) => {
    Object.keys(listeners).forEach(detachListener);
    pResolve(value);
  };
  const reject: typeof pReject = (reason) => {
    Object.keys(listeners).forEach(detachListener);
    pReject(reason);
  };
  listeners = cb(resolve, reject);
  Object.keys(listeners).forEach(attachListener);
});
