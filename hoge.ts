import Vue from "vue";
import * as nene from "nene-engine.ts";
import * as THREE from "three";
import { kzkm } from "./nodes";
import { kzkmComponent } from "./VueComponents";

kzkmComponent.RegisterVomponent();

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
        color = "#808020";
    }
    return color;
}

function MakeNodeView(node: kzkm.Node, x: number, y: number): kzkm.NodeView
{
    var style = `fill:${GetNodeColor(node)};stroke:black;stroke-width:2`;
    var nodeView = new kzkm.NodeView(node, node.id, x, y, 5, 5, 120, 50, style, ChangeSelectedNode);
    node.nodeView = nodeView;
    return nodeView;
}
function MakeEdgeView(edge: kzkm.Edge): kzkm.EdgeView
{
    var edgeView = new kzkm.EdgeView(edge);
    edgeView.stroke = "blue";
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

function Sort(nodes :kzkm.Node[], edges: kzkm.Edge[]): number[]
{
    type NodeData = 
    {
        input: number[],
        output: number[],
    };
    var MakeNodeData: ((n: kzkm.Node) => NodeData) = n =>
    {
        var node: NodeData =
        {
            input: n.inputEdges.flat().map(e => e.id),
            output: n.outputEdges.flat().map(e => e.id),
        };
        return node;
    };
    type EdgeData =
    {
        source: number,
        sink: number,
    };
    var MakeEdgeData: ((e: kzkm.Edge) => EdgeData) = e =>
    {
        var edge: EdgeData = { source: e.sourceNode.id, sink: e.sinkNode.id };
        return edge;
    };
    var nodeDatas: { [index: number]: NodeData; } = {};
    nodes.forEach(n => nodeDatas[n.id] = MakeNodeData(n));
    var edgeDatas: { [index: number]: EdgeData; } = {};
    edges.forEach(e => edgeDatas[e.id] = MakeEdgeData(e));
    var sortedNodes: number[] = [];
    var frontNodes: number[] =
        nodes.filter(n => n.inputEdges.flat().length == 0)
             .map(n => n.id);

    while (frontNodes.length != 0)
    {
        var n = frontNodes.pop();
        sortedNodes.push(n);
        nodeDatas[n].output.forEach(edgeId => {
            var m = edgeDatas[edgeId].sink;
            for (var key in nodeDatas)
            {
                nodeDatas[key].input = nodeDatas[key].input.filter(n => n != edgeId);
                nodeDatas[key].output = nodeDatas[key].output.filter(n => n != edgeId);
            }
            if (nodeDatas[m].input.length == 0)
            {
                frontNodes.push(m);
            }
        });
    }
    return sortedNodes;
}

function GenerateCode(nodes: kzkm.Node[], edges: kzkm.Edge[]): string
{
    var code = "void main(){\n";
    for (var nodeId of Sort(nodes, edges))
    {
        var node = nodes.filter(n => n.id == nodeId)[0]
        if (node instanceof kzkm.ConstantNode)
        {
            code += `vec4 variable_${ node.id }_0 = vec4(${node.value[0]}, ${node.value[1]}, ${node.value[2]}, ${node.value[3]});\n`;
        }
        else if (node instanceof kzkm.BinOpeNode)
        {
            var input0 = node.inputEdges[0][0].sourceNode;
            var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
            var input1 = node.inputEdges[1][0].sourceNode;
            var input1Port = node.inputEdges[1][0].sourceNodeOutputIndex;
            code += `vec4 variable_${ node.id }_0 = variable_${ input0.id }_${ input0Port } ${ node.ope } variable_${ input1.id }_${ input1Port };\n`;
        }
        else if (node instanceof kzkm.FragCoordNode)
        {
            code += `vec4 variable_${ node.id }_0 = vec4(gl_FragCoord.x, gl_FragCoord.y, 0.0, 1.0);\n`;
        }
        else if (node instanceof kzkm.OutputNode)
        {
            var input0 = node.inputEdges[0][0].sourceNode;
            var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
            code += `gl_FragColor = variable_${ input0.id }_${ input0Port };\n`;
        }
    };
    code += "}";
    console.log(code);
    return code;
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

console.log(nodes);

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
            this.code = GenerateCode(nodes, edges);
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