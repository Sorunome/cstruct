import { Model, Types, Classes } from "./types";

export type Dictionary<T = any> = { [k: string]: T };
export type Class<T = any> = new() => T;
export type CStructClassOptions = {
    types?: Types,
    model?: Model,
    classes?: Classes,
}
export type CStructPropertyOptions = {
    type: string,
}