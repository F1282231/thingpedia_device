"use strict";
​
const assert = require('assert');
​
module.exports = [
    ['query', 'top_news', {}, (results) => {
        console.log(results);
        assert(true, 'void test');
    }],
];
