export module kzkm
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
            return "Output";
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
            return "BinOpe";
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
            // return `Constant node: vec4(${this.value[0]}, ${this.value[1]}, ${this.value[2]}, ${this.value[3]})`;
            return `Constant`;
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

    type Port =
    {
        id: string,
        cx: number,
        cy: number,
        r: number,
    };
    export class NodeView
    {
        public inputPorts: Port[] = [];
        public outputPorts: Port[] = [];
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
                this.outputPorts.push({
                    id: "output" + i,
                    cx: width,
                    cy: height*((i + 1) / (node.outputCount + 1)),
                    r: 5});
            for (var i = 0; i < node.inputCount; i++)
                this.inputPorts.push({
                    id: "input" + i,
                    cx: 0,
                    cy: height*((i + 1) / (node.inputCount + 1)),
                    r: 5});
        }
        public mousedown = (e: MouseEvent) =>
        {
            this.onMouseDownCallback(this.id);
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
            this.endX = sinkNodeX-7;
            this.endY = sinkNodeY + sinkNodeHeight * ((sinkNodeInputIndex + 1) / (sinkNodeInputCount + 1));
            this.controllX = this.startX + 50;
            this.controllY = this.startY;
            this.SetD();
        }
    }
}
