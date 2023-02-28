import { Model, Types } from "./types";

export class ModelParser {
    private static _allowedLengthTypes = 'u8,u16,u32,u64,i8,i16,i32,i64'.split(',');

    private static _checkWhetherTypeIsString(type: string): boolean {
        return ["string", "s"].includes(type);
    }

    private static _checkWhetherSizeIsNumber(size: string): boolean {
        return !Number.isNaN(+size);
    }

    private static _checkWhetherLengthTypeIsAllowed(lengthType: string): boolean {
        return this._allowedLengthTypes.includes(lengthType);
    }

    private static _translateStaticAndDynamic(json: string, match: string, matchArray: RegExpMatchArray) {
        if (matchArray?.length === 4) {
            const {key, size, type} = matchArray.groups;
            const typeIsString = this._checkWhetherTypeIsString(type);
            const isStatic = this._checkWhetherSizeIsNumber(size);

            let replacer: string;
            // Static
            if (isStatic) {
                if (+size < 0) {
                    throw Error(`Size must be >= 0.`)
                }
                if (typeIsString) {
                    replacer = `${key}:s${size}`;
                } else {
                    replacer = `${key}:[${Array(+size).fill(type)}]`;
                }
            }
            // Dynamic
            else {
                if (!this._checkWhetherLengthTypeIsAllowed(size)) {
                    throw Error(`Unsupported dynamic length type.`);
                }
                if (typeIsString) {
                    replacer = `${key}.${size}:s`;
                } else {
                    replacer = `${key}.${size}:${type}`;
                }
            }

            json = json.split(match).join(replacer);
        }
        return json;
    }

    private static prepareJson(json: string): string {
        json = json.replace(/\/\/.*$/gm, ``); // remove comments
        json = json.replace(/^\s+$/m, ``); // remove empty lines
        json = json.replace(/\n/g, ``); // remove line breaks
        json = json.trim();
        json = json.replace(/['"]/g, ``); // remove all `'"`
        json = json.replace(/\s*([,:;{}[\]])\s*/g, `$1`); // remove spaces around `,:;{}[]`
        json = json.replace(/\s{2,}/g, ` `); // reduce ' 'x to one ' '

        return json;
    }

    private static staticArray(json: string): string {
        // `[2/Abc]`    => `[Abc,Abc]`
        // `[2/u8]`     => `[u8,u8]`
        const matches =
            json.match(/\[\w+\/\w+]/g) ??
            [];
        for (const match of matches) {
            const m = match.match(/\[(?<size>\w+)\/(?<type>\w+)]/);
            if (m?.length === 3) {
                const {size, type} = m.groups;
                const isNumber = this._checkWhetherSizeIsNumber(size);
                const typeIsString = this._checkWhetherTypeIsString(type);
                let replacer: string;
                // Static
                if (isNumber) {
                    if (+size < 0) {
                        throw Error(`Size must be >= 0.`)
                    }
                    if (typeIsString) {
                        throw Error(`Type must be other than string.`)
                    } else {
                        replacer = `[${Array(+size).fill(type)}]`;
                    }
                } else {
                    throw Error(`Size must be a number.`)
                }
                json = json.split(match).join(replacer);
            }
        }
        return json;
    }

    private static staticOrDynamic(json: string): string {
        // `{some:s[i8]}`      => `{some.i8: s}`
        // `{some:string[i8]}` => `{some.i8: s}`
        // `{some:Abc[i8]}`    => `{some.i8: Abc}`
        const matches =
            json.match(/\w+:\w+\[\w+]/g) ??
            [];
        for (const match of matches) {
            const matchArray = match.match(/(?<key>\w+):?(?<type>\w+)\[(?<size>\w+)];?/);
            json = this._translateStaticAndDynamic(json, match, matchArray);
        }
        return json;
    }

    private static cKindFields(json: string): string {
        // `{u8 a,b;i32 x,y,z;}` => `{a:u8,b:u8,x:i32,y:i32,z:i32}`
        // `{Xyz x,y,z;}`       => `{x:Xyz,y:Xyz,z:Xyz}`
        const matches =
            json.match(/\w+\s[\w,]+;/g) ?? // match `u8 a,b;`
            [];
        for (const match of matches) {
            const matchArray = match.match(/(?<type>\w+)\s(?<keys>[\w,]+);/);
            if (matchArray?.length === 3) {
                const {type, keys} = matchArray.groups;
                const replacer = keys.split(',').map(key => `${key}:${type}`).join(',') + ',';
                json = json.split(match).join(replacer);
            }
        }
        return json;
    }

    private static cKindStructs(json: string): string {
        /* C STRUCTS
        typedef struct {
            uint8_t x;
            uint8_t y;
            uint8_t z;
        } Xyz;*/
        // `{typedef struct{uint8_t x;uint8_t y;uint8_t z;}Xyz;}` => `{Xyz:{x:uint8_t,y:uint8_t,z:uint8_t}}`
        const matches =
            json.match(/typedef\sstruct\{[\w\s,:]+}\w+;/g) ?? // match `typedef struct {u8 x,y,z;}Xyz;`
            [];
        // {typedef struct{x:uint8_t,y:uint8_t,z:uint8_t,}Xyz1;typedef struct{x:uint8_t,y:uint8_t,z:uint8_t,}Xyz2;}
        for(const match of matches){
            const matchArray = match.match(/typedef\sstruct\{(?<fields>[\w\s,:]+)}(?<structType>\w+);/);
            if(matchArray?.length === 3){
                const {fields, structType} = matchArray.groups;
                const replacer = `${structType}:{${fields}}`;
                json = json.split(match).join(replacer);
            }
        }
        // {Xyz1:{x:uint8_t,y:uint8_t,z:uint8_t,}Xyz2:{x:uint8_t,y:uint8_t,z:uint8_t,}}
        return json;
    }

    private static clearJson(json: string): string {
        json = json.replace(/,([}\]])/g, '$1'); // remove last useless ','
        json = json.replace(/(.*),$/, '$1'); // remove last ','
        json = json.replace(/([}\]])\s*([{[\w])/g, '$1,$2'); // add missing ',' between }] and {[
        json = json.replace(/(\w+\.?\w*)/g, '"$1"'); // Add missing ""
        return json;
    }

    private static replaceModelTypesWithUserTypes(json: string, types?: Types): string {
        if (types) {
            const parsedTypesJson = this.parseTypes(types);
            const parsedTypes = JSON.parse(parsedTypesJson);
            const typeEntries: [string, string][] = Object.entries(parsedTypes);
            // Replace model with user types, stage 1
            typeEntries.forEach(([k, v]) => json = json.split(`"${k}"`).join(JSON.stringify(v)));
            // Reverse user types to replace nested user types
            typeEntries.reverse();
            // Replace model with reverse user types, stage 2
            typeEntries.forEach(([k, v]) => json = json.split(`"${k}"`).join(JSON.stringify(v)));
        }
        return json;
    }

    private static fixJson(json: string): string {
        if (!json) {
            throw Error(`Invalid model '${json}'`);
        }
        // Reformat json
        try {
            const model = JSON.parse(json);
            return JSON.stringify(model);
        } catch (error) {
            throw Error(`Syntax error '${json}'. ${error.message}`);
        }
    }

    static parseTypes(types: Types): string {
        if (!types) {
            return;
        }
        if (Array.isArray(types)) {
            throw Error(`Invalid types '${types}'`);
        }

        switch (typeof types) {
            case "string":
            case "object":
                return ModelParser.parseModel(types);
            default:
                throw Error(`Invalid types '${types}'`);
        }
    }

    static parseModel(model: Model, types?: Types): string {
        if (!model) {
            throw Error(`Invalid model '${model ?? typeof model}'`);
        }

        let json = (typeof model) === 'string' ? model as string : JSON.stringify(model); // stringify
        json = this.prepareJson(json);
        json = this.staticArray(json);
        json = this.staticOrDynamic(json);
        json = this.cKindFields(json);
        json = this.cKindStructs(json);
        json = this.clearJson(json);
        json = this.replaceModelTypesWithUserTypes(json, types);
        json = this.fixJson(json);

        return json;
    }
}