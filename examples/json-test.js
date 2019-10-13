const { struct } = require('../index');
let model, buffer, readBE, readLE, writeBE, writeLE, offset;



buffer = Buffer.from("aBc");

/** JSON based */
model = struct(`["s1"]`);
readBE = model.readBE(buffer);
console.log(JSON.stringify(readBE));
// ["a"]

model = struct(`["s1", "s2"]`);
readBE = model.readBE(buffer);
console.log(JSON.stringify(readBE));
// ["a","Bc"]

buffer = Buffer.concat([Buffer.from("Some error\0XXXX"), Buffer.from([7])]);

model = struct(`{ "message":"s15", "code":"u8" }`);
readBE = model.readBE(buffer);
console.log(JSON.stringify(readBE));
// {"message":"Some error","code":7}

/** JSON based */
buffer = Buffer.from(`
cc cc cc cc cc
cc cc cc cc cc
`.replace(/[ ,\n]+/g, ''), 'hex'); // 10B

/** String is shorter than 5, rest is filled with "\0" */
model = struct(`{ "msg": "s5"}`);
offset = model.writeBE(buffer, { msg: "123" });
console.log(buffer.toString('hex').match(/.{2,10}/g).join(' '));
// 3132330000 cccccccccc

buffer = Buffer.from(`
cc cc cc cc cc
cc cc cc cc cc
`.replace(/[ ,\n]+/g, ''), 'hex'); // 10B

/** String is longer than 5, string is trimed to 5 chars */
model = struct(`{ "msg": "s5"}`);
offset = model.writeBE(buffer, { msg: "1234567890" });
console.log(buffer.toString('hex').match(/.{2,10}/g).join(' '));
// 3132333435 cccccccccc

/** JSON based */
buffer = null;
model = struct(`{ "print": ["LCD", "LCD"] }`, `{ "LCD": { "line": "u8", "text": "s4" } }`);
buffer = model.makeBE({ 
    print: [
        { text: "1st ", line: 1 },
        { text: "2nd ", line: 2 },
    ]
});
console.log(buffer.toString('hex').match(/.{2,10}/g).join(' '));
// 0131737420 02326e6420
