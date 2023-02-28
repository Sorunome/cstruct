import { WriteBuffer } from "./write-buffer";
export class WriteBufferLE extends WriteBuffer {
    _u16(val = 0) {
        const buffer = Buffer.allocUnsafe(2);
        buffer.writeUInt16LE(val);
        this.addAtom('u16', buffer);
    }
    _i16(val = 0) {
        const buffer = Buffer.allocUnsafe(2);
        buffer.writeInt16LE(val);
        this.addAtom('i16', buffer);
    }
    _u32(val = 0) {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt32LE(val);
        this.addAtom('u32', buffer);
    }
    _i32(val = 0) {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeInt32LE(val);
        this.addAtom('i32', buffer);
    }
    _u64(val = 0n) {
        const buffer = Buffer.allocUnsafe(8);
        buffer.writeBigUInt64LE(val);
        this.addAtom('u64', buffer);
    }
    _i64(val = 0n) {
        const buffer = Buffer.allocUnsafe(8);
        buffer.writeBigInt64LE(val);
        this.addAtom('i64', buffer);
    }
    _f(val = 0) {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeFloatLE(val);
        this.addAtom('f', buffer);
    }
    _d(val = 0) {
        const buffer = Buffer.allocUnsafe(8);
        buffer.writeDoubleLE(val);
        this.addAtom('d', buffer);
    }
    constructor() {
        super();
        this._atomFunctions = new Map([
            ...this._atomFunctions,
            ['b16', (val) => this._i16(+Boolean(val))],
            ['b32', (val) => this._i32(+Boolean(val))],
            ['b64', (val) => this._i64(BigInt(val))],
            ['u16', (val = 0) => this._u16(val)],
            ['u32', (val = 0) => this._u32(val)],
            ['u64', (val = 0n) => this._u64(val)],
            ['i16', (val = 0) => this._i16(val)],
            ['i32', (val = 0) => this._i32(val)],
            ['i64', (val = 0n) => this._i64(val)],
            ['f', (val = 0) => this._f(val)],
            ['d', (val = 0) => this._d(val)],
        ]);
        this.addPredefinedAliases();
    }
}
//# sourceMappingURL=write-buffer-le.js.map