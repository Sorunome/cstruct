export type WriterValue = number | string | bigint | boolean | Buffer;
export type ReaderValue = number | string | bigint | boolean | Buffer;
export type ModelValue = number | string | bigint | boolean | Buffer;
export type WriterFunctions = (val: WriterValue, size?: number) => void;
export type ReaderFunctions = (size?: number) => ReaderValue;

export type Constructor<T = unknown> = new (...args: any[]) => T;

export type Model = object | ModelValue[] | string;
export type Types = object | string;
export type Classes = {[key: string]: Constructor<any>};
export type Type = object | string;
export type StructEntry = [key: string, type: Type];
export type Alias = string[]; // [type: string, ...aliases: string[]]

export interface CStructReadResult<T> {
    struct: T;
    offset: number;
    size: number;
}

export interface CStructWriteResult {
    buffer: Buffer;
    offset: number;
    size: number;
}

export enum SpecialType {
    String = 1,
    WString,
    Buffer,
    Json,
}