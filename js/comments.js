// messages map

const errorMsg = new Map();
// check -> msg
errorMsg.set('rl', '(eindeutige) repräsentative Lithologie fehlt');
//errorMsg.set('rl_code', 'repräsentative Lithologie ungültig');
errorMsg.set('ra', '(eindeutiges) repräsentatives Alter fehlt');
//errorMsg.set('ra_code', 'repräsentatives Alter ungültig');
//errorMsg.set('aaa', 'zu viele Altersangaben');
//errorMsg.set('dp', 'description purpose am Ende fehlt');
//errorMsg.set('order', 'Reihung der Codes falsch');



/* 


console.log(map1.get('a'));
// expected output: 1

map1.set('a', 97);

console.log(map1.get('a'));
// expected output: 97

console.log(map1.size);
// expected output: 3

map1.delete('b');

console.log(map1.size);
// expected output: 2 */