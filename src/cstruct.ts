import { Model, Types, Classes } from "./types";
import { ModelParser } from "./model-parser";


export class CStruct<T> {
    protected _jsonModel: string;
    protected _jsonTypes: Types;
    protected _jsonClasses: Classes;

    constructor(model: Model, types?: Types, classes?: Classes) {
        this._jsonTypes = types;
        this._jsonClasses = classes;
        this._jsonModel = ModelParser.parseModel(model, types, classes);
    }

    get jsonTypes(): string {
        return this._jsonTypes ? ModelParser.parseModel(this._jsonTypes, undefined, this._jsonClasses) : undefined;
    }

    get jsonModel(): string {
        return this._jsonModel;
    }

    get modelClone(): Model {
        return JSON.parse(this._jsonModel) as Model;
    }

    get jsonClasses(): Classes {
        return this._jsonClasses ?? {};
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    read(buffer: Buffer, offset = 0) {
        throw Error("This is abstract class");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    write(buffer: Buffer, struct: T, offset = 0) {
        throw Error("This is abstract class");
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    make(struct: T) {
        throw Error("This is abstract class");
    }
}