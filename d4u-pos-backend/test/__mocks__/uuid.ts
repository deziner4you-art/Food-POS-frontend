import { randomUUID } from 'crypto';

export const v4 = () => randomUUID();
export const v1 = () => randomUUID();
export const v3 = () => randomUUID();
export const v5 = () => randomUUID();
export const NIL = '00000000-0000-0000-0000-000000000000';
export const validate = (uuid: string) => typeof uuid === 'string' && uuid.length === 36;
export const version = (uuid: string) => 4;
