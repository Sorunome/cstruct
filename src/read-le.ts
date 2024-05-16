import { Model, Classes } from "./types";
import { Read } from "./read";
import { ReadBufferLE } from "./read-buffer-le";

export class ReadLE<T> extends Read<T> {
    constructor(model: Model, buffer: Buffer, offset = 0, classes: Classes) {
        super();
        this._reader = new ReadBufferLE(buffer, offset);
        this._struct = model as T;
        this._classes = classes;
        this.recursion(this._struct);
    }
}