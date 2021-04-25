import Vue from "vue";
import * as nene from "nene-engine.ts";
import * as THREE from "three";

namespace kzkm
{
    export enum VarType
    {
        vec2,
        vec3,
        vec4,
        err,
    }
    var nodeId = 0;
    export class Node
    {
        public nodeView: NodeView | null = null;
        public id: number;
        public inputEdges: Edge[][] = [];
        public outputEdges: Edge[][] = [];
        constructor(public inputCount: number, public outputCount: number)
        {
            this.id = nodeId++;
            for (var i = 0; i < inputCount; i++)
                this.inputEdges.push([]);
            for (var i = 0; i < outputCount; i++)
                this.outputEdges.push([]);
        }
        public Description(): string
        {
            return "None";
        }
    }

    export class OutputNode extends Node
    {
        constructor()
        {
            super(1, 0);
        }
        public Description()
        {
            return "Output node";
        }
    }

    export class BinOpeNode extends Node
    {
        
        constructor(public ope: string)
        {
            super (2, 1);
        }
        public Description()
        {
            return "BinOpe node";
        }
    }

    export class ConstantNode extends Node
    {
        constructor(public value: [number, number, number, number])
        {
            super(0, 1);
        }
        public Description()
        {
            return `Constant node: vec4(${this.value[0]}, ${this.value[1]}, ${this.value[2]}, ${this.value[3]})`;
        }
    }

    export class FragCoordNode extends Node
    {
        constructor()
        {
            super(0, 1);
        }
        public Description()
        {
            return "vec4(gl_FragCoord.x, gl_FragCoord.y, 0.0, 1.0)";
        }
    }

    var edgeId = 0;
    export class Edge
    {
        public edgeView: EdgeView | null = null;
        public id: number;
        constructor(
            public sourceNode: Node | null,
            public sourceNodeOutputIndex: number,
            public sinkNode: Node | null,
            public sinkNodeInputIndex: number)
        {
            this.id = edgeId++;
            sourceNode?.outputEdges[sourceNodeOutputIndex].push(this);
            sinkNode?.inputEdges[sinkNodeInputIndex].push(this);
        }
    }

    export class NodeView
    {
        constructor(
            public node: Node | null,
            public id: number,
            public x: number,
            public y: number,
            public rx: number,
            public ry: number,
            public width: number,
            public height: number,
            public style: string)
        {
        }
        public mousedown = (e: MouseEvent) =>
        {
            ChangeSelectedNode(this.id);
            this.prevClientX = e.clientX;
            this.prevClientY = e.clientY;
            this.dragging = true;
        };
        public mouseup = (e: MouseEvent) =>
        {
            this.dragging = false;
        };
        public mousemove = (e: MouseEvent) =>
        {
            if (this.dragging)
            {
                var deltaX = e.clientX - this.prevClientX;
                var deltaY = e.clientY - this.prevClientY;
                this.x += deltaX;
                this.y += deltaY;
                this.prevClientX = e.clientX;
                this.prevClientY = e.clientY;
                this.node?.inputEdges.flat().forEach(edge =>
                {
                    edge.edgeView?.UpdatePathData();
                });
                this.node?.outputEdges.flat().forEach(edge =>
                {
                    edge.edgeView?.UpdatePathData();
                });
            }
        };
        private dragging: boolean = false;
        private prevClientX: number = 0;
        private prevClientY: number = 0;
    }

    export class EdgeView
    {
        public startX: number = 10;
        public startY: number = 10;
        public endX: number = 20;
        public endY: number = 20;
        public controllX: number = 20;
        public controllY: number = 10;
        public stroke: string = "";
        constructor(
            public edge: Edge | null,)
        {
            this.SetD();
        }
        public d: string = "";
        private SetD()
        {
            var centerX = (this.startX + this.endX) / 2;
            var centerY = (this.startY + this.endY) / 2;
            this.d = `M ${this.startX} ${this.startY} `
                   + `Q ${this.controllX} ${this.controllY}, `
                   + `${centerX} ${centerY} `
                   + `T ${this.endX} ${this.endY}`;
        }
        public UpdatePathData()
        {
            var sourceNodeX = this.edge?.sourceNode?.nodeView?.x ?? 10;
            var sourceNodeY = this.edge?.sourceNode?.nodeView?.y ?? 10;
            var sourceNodeWidth = this.edge?.sourceNode?.nodeView?.width ?? 10;
            var sourceNodeHeight = this.edge?.sourceNode?.nodeView?.height ?? 10;
            var sourceNodeOutputCount = this.edge?.sourceNode?.outputCount ?? 10;
            var sourceNodeOutputIndex = this.edge?.sourceNodeOutputIndex ?? 0;
            var sinkNodeX = this.edge?.sinkNode?.nodeView?.x ?? 10;
            var sinkNodeY = this.edge?.sinkNode?.nodeView?.y ?? 10;
            var sinkNodeWidth = this.edge?.sinkNode?.nodeView?.width ?? 10;
            var sinkNodeHeight = this.edge?.sinkNode?.nodeView?.height ?? 10;
            var sinkNodeInputCount = this.edge?.sinkNode?.inputCount ?? 10;
            var sinkNodeInputIndex = this.edge?.sinkNodeInputIndex ?? 0;
            this.startX = sourceNodeX + sourceNodeWidth;
            this.startY = sourceNodeY + sourceNodeHeight * ((sourceNodeOutputIndex + 1) / (sourceNodeOutputCount + 1));
            this.endX = sinkNodeX;
            this.endY = sinkNodeY + sinkNodeHeight * ((sinkNodeInputIndex + 1) / (sinkNodeInputCount + 1));
            this.controllX = this.startX + 50;
            this.controllY = this.startY;
            this.SetD();
        }
    }
}

Vue.component('node', {
    props: ['prop'],
    template: '\
        <rect\
            :x="prop.x" :y="prop.y"\
            :rx="prop.rx" :ry="prop.ry"\
            :width="prop.width" :height="prop.height"\
            :style="prop.style"\
            v-on:mousedown="$emit(\'mousedown\', $event)"\
            v-on:mousemove="$emit(\'mousemove\', $event)"\
            v-on:mouseup="$emit(\'mouseup\', $event)"\
        />'
})

Vue.component('edge', {
    props: ['prop'],
    template: '\
        <path\
            :d="prop.d"\
            fill="none"\
            :stroke="prop.stroke"\
        />'
})

Vue.component('node-editor-ConstantNode', {
    props: ['prop'],
    template: '\
        <div>\
            <p>Node id: {{ prop.id }}</p>\
            <p>Description: {{ prop.Description() }}</p>\
            <input v-model="prop.value[0]"/>\
            <input v-model="prop.value[1]"/>\
            <input v-model="prop.value[2]"/>\
            <input v-model="prop.value[3]"/>\
        </div>\
    '
})
Vue.component('node-editor-BinOpeNode', {
    props: ['prop'],
    template: '\
        <div>\
            <p>Node id: {{ prop.id }}</p>\
            <p>Description: {{ prop.Description() }}</p>\
            <select v-model="prop.ope">\
                <option value="+">+</option>\
                <option value="-">-</option>\
                <option value="*">*</option>\
            </select>\
        </div>\
    '
})
Vue.component('node-editor-OutputNode', {
    props: ['prop'],
    template: '\
        <div>\
            <p>Node id: {{ prop.id }}</p>\
            <p>Description: {{ prop.Description() }}</p>\
            type is vec4\
        </div>\
    '
})
Vue.component('node-editor-FragCoordNode', {
    props: ['prop'],
    template: '\
        <div>\
            <p>Node id: {{ prop.id }}</p>\
            <p>Description: {{ prop.Description() }}</p>\
            type is vec4\
        </div>\
    '
})

function GetNodeColor(node: kzkm.Node | null): string
{
    if (node === null)
        return "red";
    var color = "green";
    if (node instanceof kzkm.OutputNode)
    {
        color = "blue";
    }
    else if (node instanceof kzkm.ConstantNode)
    {
        color = "gray";
    }
    else if (node instanceof kzkm.FragCoordNode)
    {
        color = "yellow";
    }
    return color;
}

function MakeNodeView(node: kzkm.Node, x: number, y: number): kzkm.NodeView
{
    var style = `fill:${GetNodeColor(node)};stroke:black;stroke-width:2`;
    var nodeView = new kzkm.NodeView(node, node.id, x, y, 5, 5, 100, 50, style);
    node.nodeView = nodeView;
    return nodeView;
}
function MakeEdgeView(edge: kzkm.Edge): kzkm.EdgeView
{
    var edgeView = new kzkm.EdgeView(edge);
    edgeView.stroke = "black";
    edgeView.UpdatePathData();
    edge.edgeView = edgeView;
    return edgeView;
}

var nodes: kzkm.Node[] =
[
    new kzkm.ConstantNode([0.1, 0.5, 0.2, 1]),
    new kzkm.FragCoordNode(),
    new kzkm.BinOpeNode("+"),
    new kzkm.OutputNode(),
];

var edges: kzkm.Edge[] =
[
    new kzkm.Edge(nodes[0], 0, nodes[2], 0),
    new kzkm.Edge(nodes[1], 0, nodes[2], 1),
    new kzkm.Edge(nodes[2], 0, nodes[3], 0),
];

var selectedNodeIndex = 3;

var nodeViews = nodes.map((element, index) => {
    return MakeNodeView(element, 10 + index *10, 20 + index * 10);
});

var edgeViews = edges.map((element, index) => {
    return MakeEdgeView(element);
});

var app = new Vue({
    el: '#app',
    data: {
        nodes: nodeViews,
        edges: edgeViews,
    },
    methods:
    {
        func: () => { alert("hoge") }
    }
})

function GenerateCode(node: kzkm.Node | null): string
{
    if (node instanceof kzkm.OutputNode)
    {
        return `
        void main() {
            vec4 variable_${ node.id } = ${ GenerateCode(node.inputEdges[0][0].sourceNode) };
            gl_FragColor = variable_${ node.id };
        }
        `;
    }
    else if (node instanceof kzkm.BinOpeNode)
    {
        return `${GenerateCode(node.inputEdges[0][0].sourceNode)} ${node.ope} ${GenerateCode(node.inputEdges[1][0].sourceNode)}`;
    }
    else if (node instanceof kzkm.ConstantNode)
    {
        return `vec4(${node.value[0]}, ${node.value[1]}, ${node.value[2]}, ${node.value[3]})`;
    }
    else if (node instanceof kzkm.FragCoordNode)
    {
        return "vec4(gl_FragCoord.x, gl_FragCoord.y, 0.0, 1.0)";
    }
    else if (node instanceof kzkm.Node)
    {
        return "";
    }
    return "";
}


var app3= new Vue({
   el: '#app3',
   data:
   {
       node: nodes[selectedNodeIndex],
       editor: "node-editor-" + nodes[selectedNodeIndex].constructor.name,
   },
   methods: {}
});

function ChangeSelectedNode(index: number)
{
    nodeViews[selectedNodeIndex].style = `fill:${GetNodeColor(nodeViews[selectedNodeIndex].node)};stroke:black;stroke-width:2`;
    selectedNodeIndex = index;
    app3.$data.node = nodes[index];
    app3.$data.editor = "node-editor-" + nodes[index].constructor.name;
    nodeViews[selectedNodeIndex].style = `fill:${GetNodeColor(nodeViews[selectedNodeIndex].node)};stroke:red;stroke-width:4`;
}

const fshd = `void main() {
    gl_FragColor = vec4(0.5, 0.3 + 0.3 * sin(gl_FragCoord.x / 15.0), 0.3 + 0.3 * sin(gl_FragCoord.y / 10.0), 1.0);
}`;
const vshd = `void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

class Ball extends nene.Unit
{
    public ball: THREE.Object3D;
    public shaderMat: THREE.ShaderMaterial = new THREE.ShaderMaterial({
        fragmentShader: fshd,
        vertexShader: vshd,
    });
    public Init()
    {
        const geo=new THREE.SphereBufferGeometry(4, 20, 20);
        
        this.ball = new THREE.Mesh(geo, this.shaderMat);
        this.ball.position.set(0, 0, 0);
        this.AddObject(this.ball);
    }
}

var ballUnit = new Ball();



class InitScene extends nene.Scene
{
    public Init()
    {
        this.backgroundColor = new THREE.Color(0x123456);
        this.AddUnit(ballUnit);
        this.camera.position.set(15, 15, 15);
        this.camera.lookAt(0, 0, 0);
        // ヘルパ追加
        const worldAxesHelper = new THREE.AxesHelper(100);
        worldAxesHelper.name = "helper";
        this.scene.add(worldAxesHelper);
        const worldGridHelper = new THREE.GridHelper(50, 10, 0x0000ff, 0x808080);
        worldGridHelper.name = "helper";
        this.scene.add(worldGridHelper);
        const loaclAxesHelper = new THREE.AxesHelper(100);
        loaclAxesHelper.name = "helper";
        this.scene.add(loaclAxesHelper);
    }
    public Update()
    {
    }
}
var app2 = new Vue({
    el: '#app2',
    data:
    {
        code: '',
    },
    methods:
    {
        generate: function ()
        {
            var node = nodes.filter(n => n instanceof kzkm.OutputNode)[0];
            this.code = GenerateCode(node);
            ballUnit.shaderMat.fragmentShader = this.code;
            ballUnit.shaderMat.needsUpdate = true;
        }
    }
 });
 

nene.Start("init", new InitScene(),
    {
        parent: document.getElementById("screen"),
        screenSizeX: 320,
        screenSizeY: 240
    }
)

//setInterval(() => { nodes[0].x += 1; }, 16);
// setInterval(() => { edges[0].endY += 1; edges[0].SetD(); }, 16);