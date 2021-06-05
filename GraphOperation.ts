import { Model } from "./Models";
import * as THREE from "three";


export module GraphOperation
{
    // トポロジカルソートしてノード番号のリストを返す
    export function Sort(nodes: Model.Node[], edges: Model.Edge[]): number[]
    {
        type NodeData = 
        {
            input: number[],
            output: number[],
        };
        var MakeNodeData: ((n: Model.Node) => NodeData) = n =>
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
        var MakeEdgeData: ((e: Model.Edge) => EdgeData) = e =>
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
        return sortedNodes;
    }

    // ノードのリストから重複除去
    export function UniqueNodes(nodes: Model.Node[]): Model.Node[]
    {
        var uniquedNodes: Model.Node[] = [];
        for (var node of nodes)
        {
            if (uniquedNodes.filter(n => n.id === node.id).length === 0)
                uniquedNodes.push(node);
        }
        return uniquedNodes;
    }

    // outputnode から連結なノードのみ取り出す
    export function GetLinkedNodes(nodes: Model.Node[], edges: Model.Edge[]): [Model.Node[], Model.Edge[]]
    {
        const outputNode = nodes.filter(n => n instanceof Model.OutputNode)[0];
        var linkedNodes: Model.Node[] = [outputNode];
        var linkedEdges: Model.Edge[] = [];
        // これから見ていく対象のノード
        var targetNodes: Model.Node[] = [outputNode];
        while (targetNodes.length !== 0)
        {
            const targetNode = targetNodes.pop();
            const targetEdges: Model.Edge[] = targetNode.inputEdges.flat();
            linkedEdges = linkedEdges.concat(targetEdges);
            const foundNodes = targetEdges.map(e => e.sourceNode);
            const uniquedFoundNodes = UniqueNodes(foundNodes);
            targetNodes = UniqueNodes(targetNodes.concat(uniquedFoundNodes));
            linkedNodes = UniqueNodes(linkedNodes.concat(uniquedFoundNodes));
        }
        return [linkedNodes, linkedEdges];
    }

    // グラフから GLSL コード生成
    export function GenerateCode(nodes: Model.Node[], edges: Model.Edge[], shaderMat: THREE.ShaderMaterial): string
    {
        const linkedGraph = GetLinkedNodes(nodes, edges);
        var code = "";
        const uniformNodes = linkedGraph[0].filter(n => n.useUniform);
        for (const node of uniformNodes)
        {
            if (node instanceof Model.TextureNode)
            {
                shaderMat.uniforms[`texture_${ node.id }`] = new THREE.Uniform(node.texture);
                console.log(shaderMat.uniforms.texture_2);
                code += `uniform sampler2D texture_${ node.id };\n`;
            }
            else if (node instanceof Model.UniformFloatNode)
            {
                shaderMat.uniforms[`value_${ node.id }`] = new THREE.Uniform(node.value);
                code += `uniform float value_${ node.id };\n`;
            }
        }

        code += "void main(){\n";
        
        for (var nodeId of Sort(linkedGraph[0], linkedGraph[1]))
        {
            var node = nodes.filter(n => n.id == nodeId)[0]
            if (node instanceof Model.ConstantNode)
            {
                code += `vec4 variable_${ node.id }_0 = vec4(${node.value[0]}, ${node.value[1]}, ${node.value[2]}, ${node.value[3]});\n`;
            }
            else if (node instanceof Model.BinOpeNode)
            {
                var input0 = node.inputEdges[0][0].sourceNode;
                var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
                var input1 = node.inputEdges[1][0].sourceNode;
                var input1Port = node.inputEdges[1][0].sourceNodeOutputIndex;
                code += `vec4 variable_${ node.id }_0 = variable_${ input0.id }_${ input0Port } ${ node.ope } variable_${ input1.id }_${ input1Port };\n`;
            }
            else if (node instanceof Model.FragCoordNode)
            {
                code += `vec2 variable_${ node.id }_0 = vec2(gl_FragCoord.x / 550.0, gl_FragCoord.y / 250.0);\n`;
            }
            else if (node instanceof Model.OutputNode)
            {
                var input0 = node.inputEdges[0][0].sourceNode;
                var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
                code += `gl_FragColor = variable_${ input0.id }_${ input0Port };\n`;
            }
            else if (node instanceof Model.Vec2to4Node)
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
            else if (node instanceof Model.Vec2toFloatsNode)
            {
                var input0 = node.inputEdges[0][0].sourceNode;
                var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
                code += `float variable_${ node.id }_0 = variable_${ input0.id }_${ input0Port }.x;\n`;
                code += `float variable_${ node.id }_1 = variable_${ input0.id }_${ input0Port }.y;\n`;
            }
            else if (node instanceof Model.FloatstoVec2Node)
            {
                var input0 = node.inputEdges[0][0].sourceNode;
                var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
                var input1 = node.inputEdges[1][0].sourceNode;
                var input1Port = node.inputEdges[1][0].sourceNodeOutputIndex;
                code += `vec2 variable_${ node.id }_0 = vec2(variable_${ input0.id }_${ input0Port }, variable_${ input1.id }_${ input1Port });\n`;
            }
            else if (node instanceof Model.SinNode)
            {
                var input0 = node.inputEdges[0][0].sourceNode;
                var input0Port = node.inputEdges[0][0].sourceNodeOutputIndex;
                code += `float variable_${ node.id }_0 = float(${ node.Amp }) * sin(float(${ node.AngFreq }) * variable_${ input0.id }_${ input0Port } - float(${ node.Phase }));\n`;
            }
            else if (node instanceof Model.Texture2DNode)
            {
                var input0 = node.inputEdges[0][0].sourceNode;
                var input1 = node.inputEdges[1][0].sourceNode;
                var input1Port = node.inputEdges[1][0].sourceNodeOutputIndex;
                code += `vec4 variable_${ node.id }_0 = texture2D(texture_${ input0.id }, variable_${ input1.id }_${ input1Port });\n`;
            }
            else if (node instanceof Model.UniformFloatNode)
            {
                code += `float variable_${ node.id }_0 = value_${ node.id };\n`;
            }
        };
        code += "}";
        // console.log(code);
        shaderMat.fragmentShader = code;
        shaderMat.needsUpdate = true;
        return code;
    }
}