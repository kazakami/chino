import Vue from "vue";

export module kzkm
{
    export enum VarType
    {
        bool,
        float,
        vec2,
        vec3,
        vec4,
        mat2,
        mat3,
        mat4,
        sampler2D,
        err,
    }
    export function SwizzleToIndex(key: string)
    {
        if (key === "x" || key === "r" || key === "s")
            return 0;
        else if (key === "y" || key === "g" || key === "t")
            return 1;
        else if (key === "z" || key === "b" || key === "p")
            return 2;
        else if (key === "w" || key === "a" || key === "q")
            return 3;
        else
            return -1;
    }
    var nodeId = 0;
    export class Node
    {
        public nodeView: NodeView | null = null;
        public id: number;
        public inputEdges: Edge[][] = [];
        public outputEdges: Edge[][] = [];
        public inputCount: number;
        public outputCount: number;
        public useUniform = false;
        constructor(public inputTypes: VarType[], public outputTypes: VarType[])
        {
            this.inputCount = inputTypes.length;
            this.outputCount = outputTypes.length;
            this.id = nodeId++;
            for (var i = 0; i < this.inputCount; i++)
                this.inputEdges.push([]);
            for (var i = 0; i < this.outputCount; i++)
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
            super([VarType.vec4], []);
        }
        public Description()
        {
            return "Output";
        }
    }

    export class BinOpeNode extends Node
    {
        
        constructor(public ope: string)
        {
            super ([VarType.vec4, VarType.vec4], [VarType.vec4]);
        }
        public Description()
        {
            return "BinOpe";
        }
    }

    export class ConstantNode extends Node
    {
        constructor(public value: [number, number, number, number])
        {
            super([], [VarType.vec4]);
        }
        public Description()
        {
            // return `Constant node: vec4(${this.value[0]}, ${this.value[1]}, ${this.value[2]}, ${this.value[3]})`;
            return `Constant`;
        }
    }

    export class Vec2to4Node extends Node
    {
        constructor(
            public x: string | number,
            public y: string | number,
            public z: string | number,
            public w: string | number)
        {
            super([VarType.vec2], [VarType.vec4]);
        }
        public Description()
        {
            return "Vec2 to Vec4";
        }
    }

    export class Vec2toFloatsNode extends Node
    {
        constructor()
        {
            super([VarType.vec2], [VarType.float, VarType.float]);
        }
        public Description()
        {
            return "Vec2 to floats";
        }
    }

    export class FloatstoVec2Node extends Node
    {
        constructor()
        {
            super([VarType.float, VarType.float], [VarType.vec2]);
        }
        public Description()
        {
            return "Floats to vec2";
        }
    }

    export class SinNode extends Node
    {
        public Amp: number = 1;
        public AngFreq: number = 1;
        public Phase: number = 0;
        constructor()
        {
            super([VarType.float], [VarType.float]);
        }
        public Description()
        {
            return "sine";
        }
    }

    export class TextureNode extends Node
    {
        public img: HTMLImageElement = null;
        public texture: THREE.Texture = null;
        constructor()
        {
            super([], [VarType.sampler2D]);
            this.useUniform = true;
        }
        public Description()
        {
            return "Texture";
        }
    }

    export class Texture2DNode extends Node
    {
        constructor()
        {
            super([VarType.sampler2D, VarType.vec2], [VarType.vec4]);
        }
        public Description()
        {
            return "Texture2D";
        }
    }

    export class FragCoordNode extends Node
    {
        constructor()
        {
            super([], [VarType.vec2]);
        }
        public Description()
        {
            // return "vec4(gl_FragCoord.x, gl_FragCoord.y, 0.0, 1.0)";
            return "gl_FragCoord";
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

    var vueInstance: Vue = null;
    export function SetEditor(instance: Vue)
    {
        vueInstance = instance;
    }
    var editingEdge: EditingEdgeView = null;
    var startPort: PortView;
    var targetPorts: PortView[];
    function GetNearestTargetPort(x: number, y: number): PortView | null
    {
        type Position =
        {
            portView: PortView,
            distance: number,
        };
        var positions: Position[] = [];
        for (const portView of targetPorts)
        {
            const distance = (x - (portView.nodeView.x + portView.cx)) ** 2 
            + (y - (portView.nodeView.y + portView.cy)) ** 2;
            if (distance < 500)
            {
                positions.push({portView: portView, distance: distance});
            }
        }
        if (positions.length !== 0)
        {
            const portView = positions.sort((a, b) => a.distance - b.distance)[0].portView;
            return portView;
        }
        return null;
    }
    function EditingEdgeMove(e: MouseEvent)
    {
        const x = e.offsetX;
        const y = e.offsetY;
        const nearestPortView = GetNearestTargetPort(x, y);
        if (nearestPortView !== null)
            editingEdge.Update(nearestPortView.nodeView.x + nearestPortView.cx
                             , nearestPortView.nodeView.y + nearestPortView.cy);
        else
            editingEdge.Update(x, y);
    }
    // 何故か初回のクリック時に即座に SetEdge が呼ばれるのでその対策
    var preventInitialSetEdge = false;
    function SetEdge(e: MouseEvent)
    {
        if (preventInitialSetEdge === true)
        {
            preventInitialSetEdge = false;
            return;
        }
        if (e.button == 2)
        {
            vueInstance.$data.edgeViews = vueInstance.$data.edgeViews.filter(e => e !== editingEdge);
            editingEdge = null;
            const app = document.getElementById("app");
            app.removeEventListener("mousemove", EditingEdgeMove);
            app.removeEventListener("mousedown", SetEdge);
            return;
        }
        const x = e.offsetX;
        const y = e.offsetY;
        const nearestPortView = GetNearestTargetPort(x, y);
        if (nearestPortView !== null)
        {
            vueInstance.$data.edgeViews = vueInstance.$data.edgeViews.filter(e => e !== editingEdge);
            const app = document.getElementById("app");
            app.removeEventListener("mousemove", EditingEdgeMove);
            app.removeEventListener("mousedown", SetEdge);
            var edges: Edge[] = vueInstance.$data.edges;
            var edgeViews: EdgeView[] = vueInstance.$data.edgeViews;
            if (editingEdge instanceof EditingEdgeViewSourcing)
            {
                if (startPort.nodeView.node.outputTypes[startPort.portNumber] !== nearestPortView.nodeView.node.inputTypes[nearestPortView.portNumber])
                {
                    editingEdge = null;
                    console.log("Type mismatch");
                    return;
                }
                var edge = new Edge(startPort.nodeView.node, startPort.portNumber, nearestPortView.nodeView.node, nearestPortView.portNumber);
            }
            else
            {
                if (startPort.nodeView.node.inputTypes[startPort.portNumber] !== nearestPortView.nodeView.node.outputTypes[nearestPortView.portNumber])
                {
                    editingEdge = null;
                    console.log("Type mismatch");
                    return;
                }
                var edge = new Edge(nearestPortView.nodeView.node, nearestPortView.portNumber, startPort.nodeView.node, startPort.portNumber);
            }
            editingEdge = null;
            startPort.isLinked = true;
            nearestPortView.isLinked = true;
            var edgeView = new kzkm.EdgeView(edge);
            edgeView.stroke = "blue";
            edgeView.UpdatePathData();
            edge.edgeView = edgeView;
            edges.push(edge);
            edgeViews.push(edgeView);
        }
    }

    class PortView
    {
        private preventInitialUnset = false;
        public unsetSelectedEdge = (e: MouseEvent) => {
            if (this.preventInitialUnset)
            {
                this.preventInitialUnset = false;
                return;
            }
            const app = document.getElementById("app");
            vueInstance.$data.selectedEdgeId = -1;
            app.removeEventListener("mousedown", this.unsetSelectedEdge);
        };
        constructor(
            public id: string,
            public cx: number,
            public cy: number,
            public r: number,
            public isLinked: boolean,
            public directional: "output" | "input",
            public nodeView: NodeView,
            public portNumber: number)
        {
        }
        public mousedown(e: MouseEvent)
        {
            const app = document.getElementById("app");
            if (this.isLinked)
            {
                var edgeIds: number[];
                if (this.directional === "output")
                    edgeIds = this.nodeView.node.outputEdges[this.portNumber].map(e => e.id);
                else
                    edgeIds = this.nodeView.node.inputEdges[this.portNumber].map(e => e.id);
                console.log(edgeIds);
                vueInstance.$data.selectedEdgeId =  edgeIds[0];
                this.preventInitialUnset = true;
                app.addEventListener("mousedown", this.unsetSelectedEdge);
            }
            else
            {
                if (editingEdge === null && vueInstance !== null)
                {
                    preventInitialSetEdge = true;
                    app.addEventListener("mousemove", EditingEdgeMove, false);
                    app.addEventListener("mousedown", SetEdge, false);
                    startPort = this;
                    if (this.directional === "output")
                        editingEdge = new EditingEdgeViewSourcing(this.nodeView.x + this.cx, this.nodeView.y + this.cy);
                    else
                        editingEdge = new EditingEdgeViewSinking(this.nodeView.x + this.cx, this.nodeView.y + this.cy);
                    editingEdge.Update(this.nodeView.x + this.cx, this.nodeView.y + this.cy);
                    vueInstance.$data.edgeViews.push(editingEdge);
                    const nodes: NodeView[] = vueInstance.$data.nodeViews;
                    targetPorts = [];
                    for (const node of nodes)
                    {
                        if (this.directional === "output")
                            targetPorts = targetPorts.concat(node.inputPorts);
                        else
                            targetPorts = targetPorts.concat(node.outputPorts);
                    }
                }
            }
        }
    };
    export class NodeView
    {
        public inputPorts: PortView[] = [];
        public outputPorts: PortView[] = [];
        dragging = (e: MouseEvent) => {
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
        };
        constructor(
            public node: Node | null,
            public id: number,
            public x: number,
            public y: number,
            public rx: number,
            public ry: number,
            public width: number,
            public height: number,
            public style: string,
            public onMouseDownCallback: (id: number) => void)
        {
            if (node === null)
                return;
            for (var i = 0; i < node.outputCount; i++)
                this.outputPorts.push(new PortView(
                    "output" + i,
                    width,
                    height*((i + 1) / (node.outputCount + 1)),
                    5,
                    false,
                    "output",
                    this,
                    i));
            for (var i = 0; i < node.inputCount; i++)
                this.inputPorts.push(new PortView(
                    "input" + i,
                    0,
                    height*((i + 1) / (node.inputCount + 1)),
                    5,
                    false,
                    "input",
                    this,
                    i));
        }
        public mousedown = (e: MouseEvent) =>
        {
            this.onMouseDownCallback(this.id);
            this.prevClientX = e.clientX;
            this.prevClientY = e.clientY;
            document.getElementById("app").addEventListener("mousemove", this.dragging)
        };
        public mouseup = (e: MouseEvent) =>
        {
            document.getElementById("app").removeEventListener("mousemove", this.dragging)
        };
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
            this.endX = sinkNodeX-7;
            this.endY = sinkNodeY + sinkNodeHeight * ((sinkNodeInputIndex + 1) / (sinkNodeInputCount + 1));
            this.controllX = this.startX + 50;
            this.controllY = this.startY;
            this.SetD();
        }
        public click()
        {
            console.log("ec");
        }
    }

    abstract class EditingEdgeView extends EdgeView
    {
        public abstract Update(x: number, y: number);
    }
    // ソースから伸びる
    class EditingEdgeViewSourcing extends EdgeView
    {
        constructor(x: number, y: number)
        {
            super(null);
            this.startX = x;
            this.startY = y;
            this.stroke = "red";
        }
        public Update(x: number, y: number)
        {
            this.endX = x;
            this.endY = y;
            var centerX = (this.startX + this.endX) / 2;
            var centerY = (this.startY + this.endY) / 2;
            this.controllX = this.startX + 50;
            this.controllY = this.startY;
            this.d = `M ${this.startX} ${this.startY} `
                   + `Q ${this.controllX} ${this.controllY}, `
                   + `${centerX} ${centerY} `
                   + `T ${this.endX} ${this.endY}`;
        }
    }
    // シンクから伸びる
    class EditingEdgeViewSinking extends EdgeView
    {
        constructor(x: number, y: number)
        {
            super(null);
            this.endX = x;
            this.endY = y;
            this.stroke = "red";
        }
        public Update(x: number, y: number)
        {
            this.startX = x;
            this.startY = y;
            var centerX = (this.startX + this.endX) / 2;
            var centerY = (this.startY + this.endY) / 2;
            this.controllX = this.startX + 50;
            this.controllY = this.startY;
            this.d = `M ${this.startX} ${this.startY} `
                   + `Q ${this.controllX} ${this.controllY}, `
                   + `${centerX} ${centerY} `
                   + `T ${this.endX} ${this.endY}`;
        }
    }
}
