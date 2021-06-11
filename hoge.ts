import Vue from "vue";
import * as nene from "nene-engine.ts";
import * as THREE from "three";
import { Model } from "./Models";
import { ViewModel }from "./ViewModels";
import { kzkmComponent } from "./VueComponents";
import { GraphOperation } from "./GraphOperation";

kzkmComponent.RegisterVomponent();

var nodes: Model.Node[] =
[
    new Model.OutputNode(),
];

var edges: Model.Edge[] =
[
];

var nodeViews = nodes.map((element, index) => {
    return ViewModel.MakeNodeView(element, 50 + index *10, 60 + index * 10);
});

var edgeViews = edges.map((element, index) => {
    return ViewModel.MakeEdgeView(element);
});
var graphEditor = new Vue({
    el: '#GraphEditor',
    data: {
        nodes: nodes,
        edges: edges,
        nodeViews: nodeViews,
        edgeViews: edgeViews,
        selectedNodeId: 0,
        selectedEdgeId: -1,
    },
    methods:
    {
        func: () => { alert("hoge") }
    }
});
document.getElementById("GraphEditor").oncontextmenu = () => { return false; };
ViewModel.SetGraphEditorVueInstance(graphEditor);

var nodeEditor= new Vue({
    el: '#NodeEditor',
    data:
    {
        node: nodes[0],
        editor: "node-editor-" + nodes[0].constructor.name,
    },
    methods: {
        drop: function(e: DragEvent, node: Model.Node)
        {
            e.preventDefault();
            if (!(node instanceof Model.TextureNode))
                return;
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
        input: function(e: InputEvent, node: Model.Node)
        {
            const value = Number((e.target as HTMLInputElement).value);
            console.log(value);
            if (!(node instanceof Model.UniformFloatNode))
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
document.getElementById("NodeEditor").oncontextmenu = () => { return false; };
ViewModel.SetNodeEditorVueInstance(nodeEditor);

function GetNodeFromId(id: number): Model.Node
{
    return nodes.filter(n => n.id === id)[0];
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
    ViewModel.AddNode(new Model.FragCoordNode());
};
constButton.onclick = () => {
    ViewModel.AddNode(new Model.ConstantNode([0.1, 0.2, 0.3, 1]));
    ViewModel.GetDataChannel()?.send("ope_AddConst");
};
binOpeButton.onclick = () => {
    ViewModel.AddNode(new Model.BinOpeNode("+"));
};
vec2to4Button.onclick = () => {
    ViewModel.AddNode(new Model.Vec2to4Node("x", "y", 0, 1));
};
vec2toFloatsButton.onclick = () => {
    ViewModel.AddNode(new Model.Vec2toFloatsNode());
};
floatstoVec2Button.onclick = () => {
    ViewModel.AddNode(new Model.FloatstoVec2Node());
};
sinButton.onclick = () => {
    ViewModel.AddNode(new Model.SinNode());
};
textureButton.onclick = () => {
    ViewModel.AddNode(new Model.TextureNode());
};
texture2DButton.onclick = () => {
    ViewModel.AddNode(new Model.Texture2DNode());
};
uniformFloatButton.onclick = () => {
    ViewModel.AddNode(new Model.UniformFloatNode());
};

class Ball extends nene.Unit
{
    public ball: THREE.Object3D;
    public shaderMat: THREE.ShaderMaterial = new THREE.ShaderMaterial({
        fragmentShader: `void main() {
            gl_FragColor = vec4(0.5, 0.3 + 0.3 * sin(gl_FragCoord.x / 15.0), 0.3 + 0.3 * sin(gl_FragCoord.y / 10.0), 1.0);
        }`,
        vertexShader: `void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
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
            this.code = GraphOperation.GenerateCode(nodes, edges, ballUnit.shaderMat);
            ViewModel.GetDataChannel()?.send("ope_generate");
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
            console.log("st: ", ViewModel.GetDataChannel());
        },
        submit: function()
        {
            ViewModel.GetDataChannel().send(this.chatLine);
            this.log += "You: " + this.chatLine + "\n";
            this.chatLine = "";
        }
    }
});

const dataChannelOption: RTCDataChannelInit =
{
    ordered: true,
};
const config: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    iceTransportPolicy: 'all'
};

function operate(operation: string)
{
    const AddNodeRegExp = new RegExp('^ope_AddEdge\\((\\d+),(\\d+),(\\d+),(\\d+)\\)$');
    const AddNodeRegExpMatch = AddNodeRegExp.exec(operation);
    if (operation === "ope_generate")
    {
        app2.$data.code = GraphOperation.GenerateCode(nodes, edges, ballUnit.shaderMat);
    }
    else if (operation === "ope_AddConst")
    {
        ViewModel.AddNode(new Model.ConstantNode([0.1, 0.2, 0.3, 1]));
    }
    else if (AddNodeRegExpMatch !== null)
    {
        const sourceNode = GetNodeFromId(Number(AddNodeRegExpMatch[1]));
        const sourceNodePort = Number(AddNodeRegExpMatch[2]);
        const sinkNode = GetNodeFromId(Number(AddNodeRegExpMatch[3]));
        const sinkNodePort = Number(AddNodeRegExpMatch[4]);
        var edge = new Model.Edge(sourceNode, sourceNodePort, sinkNode, sinkNodePort);
        var edgeView = new ViewModel.EdgeView(edge);
        edgeView.stroke = "blue";
        edgeView.UpdatePathData();
        edges.push(edge);
        edgeViews.push(edgeView);
    }
    else
    {
        console.log(operation);
    }
}

function SetUpDataChannel(dc: RTCDataChannel)
{
    dc.onmessage = function(e)
    {
        const data: string = e.data;
        operate(data);
        rtcApp.$data.log += "Friend: " + e.data + "\n";
    };
    dc.onopen = function()
    {
        rtcApp.$data.isConnected = true;
    };
    dc.onclose = function()
    {
        console.log("close");
    };
    dc.onerror = function(e)
    {
        console.log(e);
    };
}

async function receiveAnswer(answerData: string)
{
    answerData = answerData.replace(/\\r\\n/g, "\r\n");
    const answer = new RTCSessionDescription({
        type: "answer",
        sdp: answerData,
    });
    await ViewModel.GetPeerConnection().setRemoteDescription(answer);
}

async function recieveOffer(recieveData: string)
{
    recieveData = recieveData.replace(/\\r\\n/g, "\r\n");
    const offer = new RTCSessionDescription({
        type: "offer",
        sdp: recieveData,
    });
    var peer = new RTCPeerConnection(config);
    ViewModel.SetPeerConnection(peer);
    peer.onicecandidate = async function(e)
    {
        console.log("candidate");
        await peer.addIceCandidate(e.candidate);
    };
    peer.ondatachannel = function(e)
    {
        var dataChannel = e.channel;
        ViewModel.SetDataChannel(dataChannel);
        SetUpDataChannel(dataChannel);
    };

    await peer.setRemoteDescription(offer);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    await waitIceCandidate(peer);

    return peer.localDescription;
}

function waitIceCandidate(peer: RTCPeerConnection) {
    return new Promise<void>(resolve => {
        peer.onicecandidate = ev => {
            if (!ev.candidate) {
                resolve();
            }
        }
    });
};

async function connect()
{
    var peer = new RTCPeerConnection(config);
    ViewModel.SetPeerConnection(peer);
    peer.onicecandidate = async function(e)
    {
        console.log("candidate");
        await peer.addIceCandidate(e.candidate);
    };
    var dataChannel = peer.createDataChannel("test", dataChannelOption);
    ViewModel.SetDataChannel(dataChannel);
    SetUpDataChannel(dataChannel);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    await waitIceCandidate(peer);
    rtcApp.$data.toSend = JSON.stringify(peer.localDescription.sdp).slice(1, -1);
}

// setInterval(() => { nodes[0].x += 1; }, 16);
// setInterval(() => { edges[0].endY += 1; edges[0].SetD(); }, 16);