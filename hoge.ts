import Vue from "vue"

namespace kzkm {
    enum VarType
    {
        vec2,
        vec3,
        vec4,
        err,
    }
    class Node {
    }

    class OutputNode extends Node {

    }
}

Vue.component('node', {
    props: ['x', 'y', 'rx', 'ry', 'width', 'height', 'stl'],
    template: '\
        <rect\
            :x="x" :y="y"\
            :rx="rx" :ry="ry"\
            :width="width" :height="height"\
            :style="stl"\
            v-on:click="$emit(\'cl\')"\
        />'
})


var nodes = [
    { id: 0, x: 50, y: 150, rx: 5, ry: 5, width: 100, height: 50, style: "fill:red;stroke:black;stroke-width:2", f: () => { alert("hoge1") } },
];

var app = new Vue({
    el: '#app',
    data: {
        nodes: nodes
    },
    methods:
    {
        func: () => { alert("hoge") }
    }
})

//setInterval(() => { nodes[0].x += 1; }, 16);