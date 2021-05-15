import Vue from "vue";

export module kzkmComponent
{
    export function RegisterVomponent(): void
    {
        Vue.component('port', {
            props: ['prop', 'baseX', 'baseY'],
            template: '\
                <component\
                    v-bind:is="prop.isLinked ? \'LinkedPort\' : \'UnlinkedPort\'"\
                    v-bind:prop="prop"\
                    v-bind:baseX="baseX"\
                    v-bind:baseY="baseY"\
                    v-on:mousedown="prop.mousedown($event)"\
                />'
        });
        Vue.component('UnlinkedPort', {
            props: ['prop', 'baseX', 'baseY'],
            template: '\
            <g>\
            <rect\
                :x="prop.cx + baseX - prop.r" :y="prop.cy + baseY - prop.r"\
                :width="prop.r * 2" :height="prop.r * 2"\
                fill="red"\
                v-on:mousedown="$emit(\'mousedown\', $event)"\
            />\
            </g>'
        });
        Vue.component('LinkedPort', {
            props: ['prop', 'baseX', 'baseY'],
            template: '\
            <g>\
            <circle\
                :cx="prop.cx + baseX" :cy="prop.cy + baseY" :r="prop.r"\
                fill="black"\
                v-on:mousedown="$emit(\'mousedown\', $event)"\
            />\
            </g>'
        });
        Vue.component('node', {
            props: ['prop'],
            template: '\
                <g>\
                <rect\
                    :x="prop.x" :y="prop.y"\
                    :rx="prop.rx" :ry="prop.ry"\
                    :width="prop.width" :height="prop.height"\
                    :style="prop.style"\
                    v-on:mousedown="$emit(\'mousedown\', $event)"\
                    v-on:mouseup="$emit(\'mouseup\', $event)"\
                />\
                <text :x="prop.x+5" :y="prop.y + 20" fill="white" pointer-events="none">\
                    {{ prop.node.Description() }}\
                </text>\
                <port\
                    v-for="port in prop.inputPorts"\
                    v-bind:key="port.id"\
                    v-bind:prop="port"\
                    v-bind:baseX="prop.x"\
                    v-bind:baseY="prop.y"\
                />\
                <port\
                    v-for="port in prop.outputPorts"\
                    v-bind:key="port.id"\
                    v-bind:prop="port"\
                    v-bind:baseX="prop.x"\
                    v-bind:baseY="prop.y"\
                />\
                </g>'
        });
        Vue.component('edge', {
            props: ['prop', 'selected_id'],
            template: '\
                <path\
                    :d="prop.d"\
                    fill="none"\
                    :stroke="(prop.edge !== null &&prop.edge.id === selected_id) ? \'red\' : prop.stroke"\
                    :stroke-width="(prop.edge !== null &&prop.edge.id === selected_id) ? 4 : 2"\
                    marker-end="url(#arrow)"\
                    v-on:click="$emit(\'click\', $event)"\
                />'
        });
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
        });
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
        });
        Vue.component('node-editor-OutputNode', {
            props: ['prop'],
            template: '\
                <div>\
                    <p>Node id: {{ prop.id }}</p>\
                    <p>Description: {{ prop.Description() }}</p>\
                    type is vec4\
                </div>\
            '
        });
        Vue.component('node-editor-FragCoordNode', {
            props: ['prop'],
            template: '\
                <div>\
                    <p>Node id: {{ prop.id }}</p>\
                    <p>Description: {{ prop.Description() }}</p>\
                    type is vec2\
                </div>\
            '
        });
        Vue.component('node-editor-Vec2to4Node', {
            props: ['prop'],
            template: '\
                <div>\
                    <p>Node id: {{ prop.id }}</p>\
                    <p>Description: {{ prop.Description() }}</p>\
                    vec2 to vec4\
                    <input v-model="prop.x"/>\
                    <input v-model="prop.y"/>\
                    <input v-model="prop.z"/>\
                    <input v-model="prop.w"/>\
                </div>\
            '
        });
        Vue.component('node-editor-Vec2toFloatsNode', {
            props: ['prop'],
            template: '\
                <div>\
                    <p>Node id: {{ prop.id }}</p>\
                    <p>Description: {{ prop.Description() }}</p>\
                    vec2 to floats\
                </div>\
            '
        });
        Vue.component('node-editor-FloatstoVec2Node', {
            props: ['prop'],
            template: '\
                <div>\
                    <p>Node id: {{ prop.id }}</p>\
                    <p>Description: {{ prop.Description() }}</p>\
                    floats to vec2\
                </div>\
            '
        });
        Vue.component('node-editor-SinNode', {
            props: ['prop'],
            template: '\
                <div>\
                    <p>Node id: {{ prop.id }}</p>\
                    <p>Description: {{ prop.Description() }}</p>\
                    sin\
                    <input v-model="prop.Amp"/>\
                    <input v-model="prop.AngFreq"/>\
                    <input v-model="prop.Phase"/>\
                </div>\
            '
        });
        Vue.component('node-editor-TextureNode', {
            props: ['prop'],
            template: '\
                <div>\
                    <p>Node id: {{ prop.id }}</p>\
                    <p>Description: {{ prop.Description() }}</p>\
                    <div\
                        style="width: 100px; height: 100px; background: black;"\
                        v-on:drop="$emit(\'drop\', $event)"\
                        v-on:dragover="$emit(\'dragover\', $event)">\
                    </div>\
                </div>\
            '
        });
        Vue.component('node-editor-Texture2DNode', {
            props: ['prop'],
            template: '\
                <div>\
                    <p>Node id: {{ prop.id }}</p>\
                    <p>Description: {{ prop.Description() }}</p>\
                </div>\
            '
        });
        Vue.component('node-editor-UniformFloatNode', {
            props: ['prop'],
            template: '\
                <div>\
                    <p>Node id: {{ prop.id }}</p>\
                    <p>Description: {{ prop.Description() }}</p>\
                    <input type="range" min="0" max="1" step="0.001" v-on:input="$emit(\'input\', $event)"/>\
                </div>\
            '
        });
    }
}