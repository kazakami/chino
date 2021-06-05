export module Model
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

    export class UniformFloatNode extends Node
    {
        public value = 0.0;
        constructor()
        {
            super([], [VarType.float]);
            this.useUniform = true;
        }
        public Description()
        {
            return "Uniform float";
        }
    }

    var edgeId = 0;
    export class Edge
    {
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
}
