// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// Copyright 2020 Jack Wang <jackweijiawang@gmail.com>
//
// See LICENSE for details
"use strict";

const assert = require('assert');

module.exports = [
    ['query', 'get_top_articles', {}, (results) => {
        console.log(results);
        assert(true, 'something');
        }
    }]
];
