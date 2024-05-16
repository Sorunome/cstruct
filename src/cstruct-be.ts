import { CStruct } from "./cstruct";
import { CStructReadResult, CStructWriteResult, Model, Types, Classes } from "./types";
import { MakeBE } from "./make-be";
import { WriteBE } from "./write-be";
import { ReadBE } from "./read-be";
import { CStructMetadata } from "./decorators-metadata";
import { Class, CStructClassOptions } from "./decorators-types";

/**
 * C_Struct BE - Big Endian
 * Binary/Object and vice versa parser for JavaScript
 *
 * Parse MODEL,
 * Parse TYPES,
 * Uses Object, JSON, C_Struct lang (kind of C)
 */
export class CStructBE<T> extends CStruct<T> {
    private constructor(model: Model, types?: Types, struct?: T, classes?: Classes) {
        if (struct && classes) {
            types ??= {};
            types = typeof types === 'string' ? JSON.parse(types) : types;
            types = {
                ...<object>types,
                ...CStructMetadata.getAllTypes(struct, classes)
            };
            classes = {
                ...classes,
                ...CStructMetadata.getAllClasses(struct),
            };
        }
        super(model, types, classes);
    }

    make<T = any>(struct: T): CStructWriteResult {
        const writer = new MakeBE<T>(this.modelClone, struct);
        return {
            buffer: writer.toBuffer(),
            offset: writer.offset,
            size: writer.size
        }
    }

    write<T = any>(buffer: Buffer, struct: T, offset = 0): CStructWriteResult {
        const writer = new WriteBE<T>(this.modelClone, struct, buffer, offset);
        return {
            buffer: writer.toBuffer(),
            offset: writer.offset,
            size: writer.size
        }
    }

    read<T = any>(buffer: Buffer, offset = 0): CStructReadResult<T> {
        const reader = new ReadBE<T>(this.modelClone, buffer, offset, this.jsonClasses);
        return {
            struct: reader.toStruct(),
            offset: reader.offset,
            size: reader.size
        };
    }

    static make<T = any>(struct: T): CStructWriteResult {
        const cStruct = CStructMetadata.getCStructBE(struct);
        return cStruct.make(struct);
    }

    static write<T = any>(struct: T, buffer: Buffer, offset?: number) {
        const cStruct = CStructMetadata.getCStructBE(struct);
        return cStruct.write(buffer, struct, offset);
    }

    static read<T = any>(TClass: Class<T>, buffer: Buffer, offset?: number): CStructReadResult<T> {
        const instance = new TClass();
        const cStruct = CStructMetadata.getCStructBE(instance);
        const result = cStruct.read<T>(buffer, offset);
        result.struct = Object.assign(instance, result.struct);
        return result;
    }

    static from<T = any>(from: Class | CStructClassOptions | T): CStructBE<T> {
        return CStructMetadata.getCStructBE(from);
    }

    static fromModelTypes<T = any>(model: Model, types?: Types, struct?: T, classes?: Classes): CStructBE<T> {
        return new CStructBE<T>(model, types, struct, classes);
    }
}