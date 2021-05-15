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
    // new kzkm.ConstantNode([0.1, 0.5, 0.2, 1]),
    // new kzkm.FragCoordNode(),
    // new kzkm.BinOpeNode("+"),
    new kzkm.OutputNode(),
    // new kzkm.Vec2to4Node("x", "y", 0.0, 1.0),
    // new kzkm.FloatstoVec2Node(),
    // new kzkm.Vec2toFloatsNode(),
    // new kzkm.FragCoordNode(),
    // new kzkm.Texture2DNode(),
    // new kzkm.TextureNode(),
    // new kzkm.FragCoordNode(),
    new kzkm.UniformFloatNode(),
];
var selectedNodeIndex = 0;

var edges: kzkm.Edge[] =
[
    // new kzkm.Edge(nodes[1], 0, nodes[0], 0),
    // new kzkm.Edge(nodes[2], 0, nodes[1], 0),
    // new kzkm.Edge(nodes[3], 0, nodes[1], 1),
    // new kzkm.Edge(nodes[1], 0, nodes[0], 0),
    // new kzkm.Edge(nodes[2], 0, nodes[1], 0),
    // new kzkm.Edge(nodes[3], 0, nodes[2], 0),
    // new kzkm.Edge(nodes[3], 1, nodes[2], 1),
    // new kzkm.Edge(nodes[4], 0, nodes[3], 0),
];

var nodeViews = nodes.map((element, index) => {
    return MakeNodeView(element, 50 + index *10, 60 + index * 10);
});

var edgeViews = edges.map((element, index) => {
    return MakeEdgeView(element);
});

function AddNode(node: kzkm.Node)
{
    nodes.push(node);
    nodeViews.push(MakeNodeView(node, 10, 20));
}

const glCoordButton = document.getElementById("glCoord");
const constButton = document.getElementById("const");
const binOpeButton = document.getElementById("binOpe");
const vec2to4Button = document.getElementById("vec2to4");
const vec2toFloatsButton = document.getElementById("vec2toFloats");
const floatstoVec2Button = document.getElementById("floatstoVec2");
const sinButton = document.getElementById("sin");
const textureButton = document.getElementById("texture");
const texture2DButton = document.getElementById("texture2D");
const uniformFloatButton = document.getElementById("uniformFloat");
glCoordButton.onclick = () => {
    AddNode(new kzkm.FragCoordNode());
};
constButton.onclick = () => {
    AddNode(new kzkm.ConstantNode([0.1, 0.2, 0.3, 1]));
};
binOpeButton.onclick = () => {
    AddNode(new kzkm.BinOpeNode("+"));
};
vec2to4Button.onclick = () => {
    AddNode(new kzkm.Vec2to4Node("x", "y", 0, 1));
};
vec2toFloatsButton.onclick = () => {
    AddNode(new kzkm.Vec2toFloatsNode());
};
floatstoVec2Button.onclick = () => {
    AddNode(new kzkm.FloatstoVec2Node());
};
sinButton.onclick = () => {
    AddNode(new kzkm.SinNode());
};
textureButton.onclick = () => {
    AddNode(new kzkm.TextureNode());
};
texture2DButton.onclick = () => {
    AddNode(new kzkm.Texture2DNode());
};
uniformFloatButton.onclick = () => {
    AddNode(new kzkm.UniformFloatNode());
};


var app = new Vue({
    el: '#app',
    data: {
        nodeViews: nodeViews,
        edgeViews: edgeViews,
        nodes: nodes,
        edges: edges,
        selectedEdgeId: -1,
    },
    methods:
    {
        func: () => { alert("hoge") }
    }
});

document.getElementById("app").oncontextmenu = () => { return false; };

kzkm.SetEditor(app);


function Sort(nodes: kzkm.Node[], edges: kzkm.Edge[]): number[]
{
    console.log(nodes);
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
    // 入力が無い状態のノード
    var frontNodes: number[] =
        nodes.filter(n => n.inputEdges.flat().length == 0)
             .map(n => n.id);

    while (frontNodes.length !== 0)
    {
        var n = frontNodes.pop();
        sortedNodes.push(n);
        nodeDatas[n].output.forEach(edgeId => {
            var m = edgeDatas[edgeId].sink;
            delete edgeDatas[edgeId];
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
        delete nodeDatas[n];
    }
    //console.log(sortedNodes);
    //console.log(Object.keys(edgeDatas).length);
    return sortedNodes;
}

function UniqueNodes(nodes: kzkm.Node[])
{
    var uniquedNodes: kzkm.Node[] = [];
    for (var node of nodes)
    {
        if (uniquedNodes.filter(n => n.id === node.id).length === 0)
            uniquedNodes.push(node);
    }
    return uniquedNodes;
}

// outputnode から連結なノードのみ取り出す
function GetLinkedNodes(nodes: kzkm.Node[], edges: kzkm.Edge[]): [kzkm.Node[], kzkm.Edge[]]
{
    const outputNode = nodes.filter(n => n instanceof kzkm.OutputNode)[0];
    var linkedNodes: kzkm.Node[] = [outputNode];
    var linkedEdges: kzkm.Edge[] = [];
    // これから見ていく対象のノード
    var targetNodes: kzkm.Node[] = [outputNode];
    while (targetNodes.length !== 0)
    {
        const targetNode = targetNodes.pop();
        const targetEdges: kzkm.Edge[] = targetNode.inputEdges.flat();
        linkedEdges = linkedEdges.concat(targetEdges);
        const foundNodes = targetEdges.map(e => e.sourceNode);
        const uniquedFoundNodes = UniqueNodes(foundNodes);
        targetNodes = UniqueNodes(targetNodes.concat(uniquedFoundNodes));
        linkedNodes = UniqueNodes(linkedNodes.concat(uniquedFoundNodes));
    }
    return [linkedNodes, linkedEdges];
}

function GenerateCode(nodes: kzkm.Node[], edges: kzkm.Edge[], shaderMat: THREE.ShaderMaterial): string
{
    const linkedGraph = GetLinkedNodes(nodes, edges);
    var code = "";
    const uniformNodes = linkedGraph[0].filter(n => n.useUniform);
    for (const node of uniformNodes)
    {
        if (node instanceof kzkm.TextureNode)
        {
            shaderMat.uniforms[`texture_${ node.id }`] = new THREE.Uniform(node.texture);
            console.log(shaderMat.uniforms.texture_2);
            code += `uniform sampler2D texture_${ node.id };\n`;
        }
        else if (node instanceof kzkm.UniformFloatNode)
        {
            shaderMat.uniforms[`value_${ node.id }`] = new THREE.Uniform(node.value);
            code += `uniform float value_${ node.id };\n`;
        }
    }

    code += "void main(){\n";
    
    for (var nodeId of Sort(linkedGraph[0], linkedGraph[1]))
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
            code += `vec2 variable_${ node.id }_0 = vec2(gl_FragCoord.x / 550.0, gl_FragCoord.y / 250.0);\n`;
        }
        else if (node instanceof kzkm.OutputNode)
        {
            var input0 = node.inputEdges[0][0].sourceNode;
            var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
            code += `gl_FragColor = variable_${ input0.id }_${ input0Port };\n`;
        }
        else if (node instanceof kzkm.Vec2to4Node)
        {
            var input0 = node.inputEdges[0][0].sourceNode;
            var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
            var x: string;
            var y: string;
            var z: string;
            var w: string;
            // swizzle か数値かで分岐
            const toData = (input: string | number) => {
                if (typeof input === 'number' || isFinite(input as any))
                    return input.toString();
                else
                    return `variable_${ input0.id }_${ input0Port }.${ input }`;
            }
            x = toData(node.x);
            y = toData(node.y);
            z = toData(node.z);
            w = toData(node.w);
            code += `vec4 variable_${ node.id }_0 = vec4(${x}, ${y}, ${z}, ${w});\n`;
        }
        else if (node instanceof kzkm.Vec2toFloatsNode)
        {
            var input0 = node.inputEdges[0][0].sourceNode;
            var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
            code += `float variable_${ node.id }_0 = variable_${ input0.id }_${ input0Port }.x;\n`;
            code += `float variable_${ node.id }_1 = variable_${ input0.id }_${ input0Port }.y;\n`;
        }
        else if (node instanceof kzkm.FloatstoVec2Node)
        {
            var input0 = node.inputEdges[0][0].sourceNode;
            var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
            var input1 = node.inputEdges[1][0].sourceNode;
            var input1Port = node.inputEdges[1][0].sourceNodeOutputIndex;
            code += `vec2 variable_${ node.id }_0 = vec2(variable_${ input0.id }_${ input0Port }, variable_${ input1.id }_${ input1Port });\n`;
        }
        else if (node instanceof kzkm.SinNode)
        {
            var input0 = node.inputEdges[0][0].sourceNode;
            var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
            code += `float variable_${ node.id }_0 = float(${ node.Amp }) * sin(float(${ node.AngFreq }) * variable_${ input0.id }_${ input0Port } - float(${ node.Phase }));\n`;
        }
        else if (node instanceof kzkm.Texture2DNode)
        {
            var input0 = node.inputEdges[0][0].sourceNode;
            var input1 = node.inputEdges[1][0].sourceNode;
            var input1Port = node.inputEdges[1][0].sourceNodeOutputIndex;
            code += `vec4 variable_${ node.id }_0 = texture2D(texture_${ input0.id }, variable_${ input1.id }_${ input1Port });\n`;
        }
        else if (node instanceof kzkm.UniformFloatNode)
        {
            code += `float variable_${ node.id }_0 = value_${ node.id };\n`;
        }
    };
    code += "}";
    console.log(code);
    shaderMat.fragmentShader = code;
    shaderMat.needsUpdate = true;
    return code;
}


var app3= new Vue({
    el: '#app3',
    data:
    {
        node: nodes[selectedNodeIndex],
        editor: "node-editor-" + nodes[selectedNodeIndex].constructor.name,
    },
    methods: {
        drop: function(e: DragEvent, node: kzkm.Node)
        {
            e.preventDefault();
            // console.log(node);
            if (!(node instanceof kzkm.TextureNode))
                return;
            // console.log(e);
            // console.log(e.dataTransfer);
            const files = e.dataTransfer.files;
            if (files.length === 0)
                return;
            const file = files[0];
            console.log(file);
            const reader = new FileReader();
            reader.onload = function(e)
            {
                node.img = document.createElement("img");
                node.img.setAttribute("src", e.target.result as string);
                //document.getElementById("app2").appendChild(node.img);
                node.texture = new THREE.Texture(node.img);
                node.texture.needsUpdate = true;
                console.log(node.texture);
                console.log(e);
            };
            reader.readAsDataURL(file);
        },
        dragover: function(e: DragEvent)
        {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        },
        input: function(e: InputEvent, node: kzkm.Node)
        {
            //console.log(e);
            // console.log((e.target as HTMLInputElement).value);
            const value = Number((e.target as HTMLInputElement).value);
            console.log(value);
            if (!(node instanceof kzkm.UniformFloatNode))
                return;
            node.value = value;
            const uniform = ballUnit.shaderMat.uniforms[`value_${ node.id }`];
            if (uniform !== undefined)
            {
                uniform.value = value;
                ballUnit.shaderMat.needsUpdate = true;
            }
        }
    }
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
    private cameraDistance = 15;
    resize = (e: UIEvent) => {
        const screen = document.getElementById("screen");
        const width = screen.clientWidth;
        const height = screen.clientHeight;
        this.core.ChangeScreenSize(width, height);
        this.ResizeCanvas(width, height);
    }
    public Init()
    {
        this.resize(null);
        this.backgroundColor = new THREE.Color(0x123456);
        this.AddUnit(ballUnit);
        this.camera.position.set(this.cameraDistance, this.cameraDistance, this.cameraDistance);
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
        window.addEventListener("resize", this.resize);
        this.onWheel = (e) =>
        {
            e.preventDefault();
            if (e.deltaY > 0)
                this.cameraDistance *= 1.1;
            else
                this.cameraDistance /= 1.1;
            this.cameraDistance = nene.Clamp(this.cameraDistance, 2.8, 30);
            this.camera.position.set(this.cameraDistance, this.cameraDistance, this.cameraDistance);
        };
        this.onContextmenu = (e) => { e.preventDefault(); };
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
            this.code = GenerateCode(nodes, edges, ballUnit.shaderMat);
        }
    }
 });
 

const screen = document.getElementById("screen");
nene.Start("init", new InitScene(),
    {
        parent: screen,
        screenSizeX: screen.clientWidth,
        screenSizeY: screen.clientHeight,
    }
);


var peer: RTCPeerConnection;
var dataChannel: RTCDataChannel;

var rtcApp = new Vue({
    el: '#rtc',
    data:
    {
        toSend: '',
        recieveData: '',
        answerData: '',
        isHosting: false,
        isJoining: false,
        isConnected: false,
        log: '',
        chatLine: '',
    },
    methods:
    {
        recieve: async function ()
        {
            const answer = await recieveOffer(this.recieveData);
            this.toSend = JSON.stringify(answer.sdp).slice(1, -1);
        },
        makeConnection: function ()
        {
            this.isHosting = true;
            connect();
        },
        joinConnection: function ()
        {
            this.isJoining = true;
        },
        answer: async function ()
        {
            receiveAnswer(this.answerData);
        },
        viewChannel: function()
        {
            console.log("st: ", dataChannel);
        },
        submit: function()
        {
            dataChannel.send(this.chatLine);
            this.log += "You: " + this.chatLine + "\n";
            this.chatLine = "";
        }
    }
});

const dataChannelOption: RTCDataChannelInit =
{
    ordered: true,
}
const config: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    iceTransportPolicy: 'all'
}

async function receiveAnswer(answerData: string)
{
    answerData = answerData.replace(/\\r\\n/g, "\r\n");
    const answer = new RTCSessionDescription({
        type: "answer",
        sdp: answerData,
    });
    await peer.setRemoteDescription(answer);
}

async function recieveOffer(recieveData: string)
{
    recieveData = recieveData.replace(/\\r\\n/g, "\r\n");
    //console.log(recieveData);
    const offer = new RTCSessionDescription({
        type: "offer",
        sdp: recieveData,
    });
    console.log("new");
    peer = new RTCPeerConnection(config);
    peer.onicecandidate = async function(e)
    {
        console.log("candidate");
        await peer.addIceCandidate(e.candidate);
    };
    peer.ondatachannel = function(e)
    {
        dataChannel = e.channel;
        dataChannel.onmessage = function(e)
        {
            // console.log("r: ", e.data);
            rtcApp.$data.log += "Friend: " + e.data + "\n";
        };
        dataChannel.onopen = function()
        {
            // console.log("open");
            // console.log(dataChannel.readyState);
            rtcApp.$data.isConnected = true;
        };
        dataChannel.onclose = function()
        {
            console.log("close");
        };
        dataChannel.onerror = function(e)
        {
            console.log(e);
        };
    };

    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await waitVannilaIce(peer);

    //console.log(peer.localDescription)
    return peer.localDescription;
}



const waitVannilaIce = p => {
    return new Promise<void>(resolve => {
        p.onicecandidate = ev => {
            if (!ev.candidate) {
                resolve()
            }
        }
    });
};
async function connect()
{
    console.log("new");
    peer = new RTCPeerConnection(config);
    peer.onicecandidate = async function(e)
    {
        console.log("candidate");
        await peer.addIceCandidate(e.candidate);
    };
    dataChannel = peer.createDataChannel("test", dataChannelOption);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitVannilaIce(peer);
    rtcApp.$data.toSend = JSON.stringify(peer.localDescription.sdp).slice(1, -1);

    dataChannel.onmessage = function(e)
    {
        // console.log("r: ", e.data);
        rtcApp.$data.log += "Friend: " + e.data + "\n";
    };
    dataChannel.onopen = function()
    {
        // console.log("open");
        // console.log(dataChannel.readyState);
        // dataChannel.send("hogeeeee");
        rtcApp.$data.isConnected = true;
    };
    dataChannel.onclose = function()
    {
        console.log("close");
    };
    dataChannel.onerror = function(e)
    {
        console.log(e);
    };
}

// setInterval(() => { nodes[0].x += 1; }, 16);
// setInterval(() => { edges[0].endY += 1; edges[0].SetD(); }, 16);