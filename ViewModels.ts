import Vue from "vue";
import { Model } from "./Models";

export namespace ViewModel
{
    class ViewModel
    {
        public graphEditorVueInstance: Vue = null;
        public nodeEditorVueInstance: Vue = null;
        public dataChannel: RTCDataChannel = null;
        public editingEdge: EditingEdgeView = null;
        public startPort: PortView;
        public targetPorts: PortView[];
        public graphEditorElement: HTMLElement = null;
        public nodeEditorElement: HTMLElement = null;
        constructor()
        {

        }
        public SearchNodeView(node: Model.Node)
        {
            const nodeViews: NodeView[] = this.graphEditorVueInstance.$data.nodeViews;
            return nodeViews.filter(n => n.node.id === node.id)[0];
        }
        public SearchEdgeView(edge: Model.Edge)
        {
            const edgeViews: EdgeView[] = this.graphEditorVueInstance.$data.edgeViews;
            return edgeViews.filter(e => e.edge.id === edge.id)[0];
        }
    }
    var viewModel = new ViewModel()
    export function SetGraphEditorVueInstance(instance: Vue)
    {
        viewModel.graphEditorVueInstance = instance;
        viewModel.graphEditorElement = instance.$el as HTMLElement;
    }
    export function SetNodeEditorVueInstance(instance: Vue)
    {
        viewModel.nodeEditorVueInstance = instance;
        viewModel.nodeEditorElement = instance.$el as HTMLElement;
    }
    export function SetDataChannel(dc: RTCDataChannel)
    {
        viewModel.dataChannel = dc;
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
            viewModel.graphEditorVueInstance.$data.selectedEdgeId = -1;
            viewModel.graphEditorElement.removeEventListener("mousedown", this.unsetSelectedEdge);
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
            if (this.isLinked)
            {
                var edgeIds: number[];
                if (this.directional === "output")
                    edgeIds = this.nodeView.node.outputEdges[this.portNumber].map(e => e.id);
                else
                    edgeIds = this.nodeView.node.inputEdges[this.portNumber].map(e => e.id);
                console.log(edgeIds);
                viewModel.graphEditorVueInstance.$data.selectedEdgeId =  edgeIds[0];
                this.preventInitialUnset = true;
                viewModel.graphEditorElement.addEventListener("mousedown", this.unsetSelectedEdge);
            }
            else
            {
                if (viewModel.editingEdge === null && viewModel.graphEditorVueInstance !== null)
                {
                    preventInitialSetEdge = true;
                    viewModel.graphEditorElement.addEventListener("mousemove", EditingEdgeMove, false);
                    viewModel.graphEditorElement.addEventListener("mousedown", SetEdge, false);
                    viewModel.startPort = this;
                    if (this.directional === "output")
                        viewModel.editingEdge = new EditingEdgeViewSourcing(this.nodeView.x + this.cx, this.nodeView.y + this.cy);
                    else
                        viewModel.editingEdge = new EditingEdgeViewSinking(this.nodeView.x + this.cx, this.nodeView.y + this.cy);
                    viewModel.editingEdge.Update(this.nodeView.x + this.cx, this.nodeView.y + this.cy);
                    viewModel.graphEditorVueInstance.$data.edgeViews.push(viewModel.editingEdge);
                    const nodes: NodeView[] = viewModel.graphEditorVueInstance.$data.nodeViews;
                    viewModel.targetPorts = [];
                    for (const node of nodes)
                    {
                        if (this.directional === "output")
                            viewModel.targetPorts = viewModel.targetPorts.concat(node.inputPorts);
                        else
                            viewModel.targetPorts = viewModel.targetPorts.concat(node.outputPorts);
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
                viewModel.SearchEdgeView(edge)?.UpdatePathData();
            });
            this.node?.outputEdges.flat().forEach(edge =>
            {
                viewModel.SearchEdgeView(edge)?.UpdatePathData();
            });
        };
        constructor(
            public node: Model.Node | null,
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
            viewModel.graphEditorElement.addEventListener("mousemove", this.dragging)
        };
        public mouseup = (e: MouseEvent) =>
        {
            viewModel.graphEditorElement.removeEventListener("mousemove", this.dragging)
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
            public edge: Model.Edge | null,)
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
            const sourceNodeView = viewModel.SearchNodeView(this.edge?.sourceNode);
            const sinkNodeView = viewModel.SearchNodeView(this.edge?.sinkNode);
            var sourceNodeX = sourceNodeView?.x ?? 10;
            var sourceNodeY = sourceNodeView?.y ?? 10;
            var sourceNodeWidth = sourceNodeView?.width ?? 10;
            var sourceNodeHeight = sourceNodeView?.height ?? 10;
            var sourceNodeOutputCount = this.edge?.sourceNode?.outputCount ?? 10;
            var sourceNodeOutputIndex = this.edge?.sourceNodeOutputIndex ?? 0;
            var sinkNodeX = sinkNodeView?.x ?? 10;
            var sinkNodeY = sinkNodeView?.y ?? 10;
            var sinkNodeWidth = sinkNodeView?.width ?? 10;
            var sinkNodeHeight = sinkNodeView?.height ?? 10;
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
    function GetNodeColor(node: Model.Node | null): string
    {
        if (node === null)
            return "red";
        var color = "green";
        if (node instanceof Model.OutputNode)
        {
            color = "blue";
        }
        else if (node instanceof Model.ConstantNode)
        {
            color = "gray";
        }
        else if (node instanceof Model.FragCoordNode)
        {
            color = "#808020";
        }
        return color;
    }
    function ChangeSelectedNode(index: number)
    {
        var nodeView: NodeView[] = viewModel.graphEditorVueInstance.$data.nodeViews;
        const oldSelectedId = viewModel.graphEditorVueInstance.$data.selectedNodeId;

        nodeView[oldSelectedId].style
            = `fill:${GetNodeColor(nodeView[oldSelectedId].node)};stroke:black;stroke-width:2`;
        viewModel.graphEditorVueInstance.$data.selectedNodeId = index;
        viewModel.nodeEditorVueInstance.$data.node = viewModel.graphEditorVueInstance.$data.nodes[index];
        viewModel.nodeEditorVueInstance.$data.editor = "node-editor-" + viewModel.graphEditorVueInstance.$data.nodes[index].constructor.name;
        nodeView[index].style
            = `fill:${GetNodeColor(nodeView[index].node)};stroke:red;stroke-width:4`;
    }
    export function MakeNodeView(node: Model.Node, x: number, y: number): ViewModel.NodeView
    {
        var style = `fill:${GetNodeColor(node)};stroke:black;stroke-width:2`;
        var nodeView = new NodeView(node, node.id, x, y, 5, 5, 120, 50, style, ChangeSelectedNode);
        return nodeView;
    }
    export function MakeEdgeView(edge: Model.Edge): ViewModel.EdgeView
    {
        var edgeView = new EdgeView(edge);
        edgeView.stroke = "blue";
        edgeView.UpdatePathData();
        return edgeView;
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
    function GetNearestTargetPort(x: number, y: number): PortView | null
    {
        type Position =
        {
            portView: PortView,
            distance: number,
        };
        var positions: Position[] = [];
        for (const portView of viewModel.targetPorts)
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
            viewModel.editingEdge.Update(nearestPortView.nodeView.x + nearestPortView.cx
                , nearestPortView.nodeView.y + nearestPortView.cy);
        else
            viewModel.editingEdge.Update(x, y);
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
            viewModel.graphEditorVueInstance.$data.edgeViews
                = viewModel.graphEditorVueInstance.$data.edgeViews.filter((e: EdgeView) => e !== viewModel.editingEdge);
            viewModel.editingEdge = null;
            viewModel.graphEditorElement.removeEventListener("mousemove", EditingEdgeMove);
            viewModel.graphEditorElement.removeEventListener("mousedown", SetEdge);
            return;
        }
        const x = e.offsetX;
        const y = e.offsetY;
        const nearestPortView = GetNearestTargetPort(x, y);
        if (nearestPortView !== null)
        {
            viewModel.graphEditorVueInstance.$data.edgeViews
                = viewModel.graphEditorVueInstance.$data.edgeViews.filter((e: EdgeView) => e !== viewModel.editingEdge);
            viewModel.graphEditorElement.removeEventListener("mousemove", EditingEdgeMove);
            viewModel.graphEditorElement.removeEventListener("mousedown", SetEdge);
            var edges: Model.Edge[] = viewModel.graphEditorVueInstance.$data.edges;
            var edgeViews: EdgeView[] = viewModel.graphEditorVueInstance.$data.edgeViews;
            if (viewModel.editingEdge instanceof EditingEdgeViewSourcing)
            {
                if (viewModel.startPort.nodeView.node.outputTypes[viewModel.startPort.portNumber] !== nearestPortView.nodeView.node.inputTypes[nearestPortView.portNumber])
                {
                    viewModel.editingEdge = null;
                    console.log("Type mismatch");
                    return;
                }
                var edge = new Model.Edge(viewModel.startPort.nodeView.node, viewModel.startPort.portNumber, nearestPortView.nodeView.node, nearestPortView.portNumber);
                viewModel.dataChannel?.send(`ope_AddEdge(${viewModel.startPort.nodeView.node.id},${viewModel.startPort.portNumber},${nearestPortView.nodeView.node.id},${nearestPortView.portNumber})`);
            }
            else
            {
                if (viewModel.startPort.nodeView.node.inputTypes[viewModel.startPort.portNumber] !== nearestPortView.nodeView.node.outputTypes[nearestPortView.portNumber])
                {
                    viewModel.editingEdge = null;
                    console.log("Type mismatch");
                    return;
                }
                var edge = new Model.Edge(nearestPortView.nodeView.node, nearestPortView.portNumber, viewModel.startPort.nodeView.node, viewModel.startPort.portNumber);
                viewModel.dataChannel?.send(`ope_AddEdge(${nearestPortView.nodeView.node.id},${nearestPortView.portNumber},${viewModel.startPort.nodeView.node.id},${viewModel.startPort.portNumber})`);
            }
            viewModel.editingEdge = null;
            viewModel.startPort.isLinked = true;
            nearestPortView.isLinked = true;
            var edgeView = new EdgeView(edge);
            edgeView.stroke = "blue";
            edgeView.UpdatePathData();
            edges.push(edge);
            edgeViews.push(edgeView);
        }
    }
}