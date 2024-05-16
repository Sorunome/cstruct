import { Model, Types, Classes, Constructor } from "./types";
import { CStructBE } from "./cstruct-be";
import { CStructLE } from "./cstruct-le";
import { CStructClassOptions, CStructPropertyOptions, Dictionary } from "./decorators-types";
import { parse } from "path";


export class CStructMetadata {
    model: Model;
    types: Types;
    classes: Classes;
    cStruct: CStructBE<any> | CStructLE<any>;
    class: Constructor<any>;
    className: string;
    static CStructSymbol = Symbol('CStruct');

    constructor() {
        this.model = {};
        this.types = {};
        this.classes = {};
        this.cStruct = null;
    }

    static getMetadata(target: any) {
        const constructorMetadata = target.constructor?.[this.CStructSymbol];
        const prototypeMetadata = target.prototype?.[this.CStructSymbol];
        const targetMetadata = target[this.CStructSymbol];
        let metadata = constructorMetadata ?? prototypeMetadata ?? targetMetadata;
        if (!metadata) {
            metadata = target[this.CStructSymbol] = new CStructMetadata();
            if ('model' in target) {
                metadata.model = target.model;
                metadata.types = target.types;
                metadata.classes = target.classes;
            }
        }
        return metadata;
    }

    static addProperty<T>(target: T & Dictionary, propertyName: string, options: CStructPropertyOptions) {
        const metadata = CStructMetadata.getMetadata(target);
        metadata.model[propertyName] = options.type;
    }

    static addClass<T>(target: T & Dictionary, options: CStructClassOptions) {
        const metadata = CStructMetadata.getMetadata(target);
        metadata.types = options.types;
        metadata.model = options.model ?? metadata.model;
        metadata.classes = {
            ...metadata.classes,
            ...options.classes,
        };
        metadata.class = target as unknown as Constructor<T>;
        metadata.className = target.name;
    }

    static getCStructBE<T>(struct: T): CStructBE<T> {
        const metadata = CStructMetadata.getMetadata(struct);
        if (!metadata.cStruct) {
            if (!metadata.model) {
                throw Error(`Provided struct is not decorated.`);
            }
            metadata.cStruct = CStructBE.fromModelTypes(metadata.model, metadata.types, metadata.classes);
        }
        return metadata.cStruct as CStructBE<T>;
    }

    static getCStructLE<T>(struct: T): CStructLE<T> {
        const metadata = CStructMetadata.getMetadata(struct);
        if (!metadata.cStruct) {
            if (!metadata.model) {
                throw Error(`Provided struct is not decorated.`);
            }
            metadata.cStruct = CStructLE.fromModelTypes(metadata.model, metadata.types, struct, metadata.classes);
        }
        return metadata.cStruct as CStructLE<T>;
    }

    static getModel<T>(struct: T): Model {
        const metadata = CStructMetadata.getMetadata(struct);
        return metadata.model;
    }

    static getTypes<T>(struct: T): Types {
        const metadata = CStructMetadata.getMetadata(struct);
        return metadata.types;
    }

    static getAllTypes<T>(struct: T, classes?: Classes): object {
        const metadata = CStructMetadata.getMetadata(struct);
        classes ??= metadata.classes ?? {};
        let types = metadata.types ?? {};
        types = typeof types === 'string' ? JSON.parse(types) : types;
        let model = metadata.model ?? {};
        model = typeof model === 'string' ? JSON.parse(model) : model;
        types = {
            ...types,
            [(struct as any).name]: model,
        };
        for (const key of Object.getOwnPropertyNames(classes)) {
            types = {
                ...types,
                ...CStructMetadata.getAllTypes(classes[key]),
            };
        }
        return types;
    }

    static getClasses<T>(struct: T): Classes {
        const metadata = CStructMetadata.getMetadata(struct);
        return metadata.classes;
    }

    static getAllClasses<T>(struct: T): Classes {
        const metadata = CStructMetadata.getMetadata(struct);
        let classes = metadata.classes ?? {};
        for (const value of Object.values(metadata.classes ?? {})) {
            classes = {
                ...classes,
                ...CStructMetadata.getAllClasses(value),
            };
        }
        return classes;
    }
}