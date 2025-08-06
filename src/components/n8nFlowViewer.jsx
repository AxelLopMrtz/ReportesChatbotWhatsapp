import React, { useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    MarkerType,
    Panel,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';

const emojiMap = {
    webhook: '🌐',
    respondToWebhook: '📤',
    mySql: '🗄️',
    if: '❓',
    switch: '🔀',
    set: '⚙️',
};

const getNodeIcon = (type) => {
    const t = type.toLowerCase();
    return (
        Object.entries(emojiMap).find(([key]) => t.includes(key))?.[1] || '📦'
    );
};

const N8nFlowViewer = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [darkMode, setDarkMode] = useState(true);

    const theme = darkMode
        ? {
            background: '#1e1e1e',           // fondo general del canvas
            border: '#303f9f',               // borde de los nodos (azul oscuro)
            nodeBg: '#2c2c2c',               // fondo del nodo (gris oscuro)
            nodeColor: '#f0f0f0',            // color del texto (blanco tenue)
            miniMapBg: '#1e1e1e',            // fondo del minimapa
            miniMapNode: '#7986cb',          // color de nodos en minimapa
            edgeColor: '#7986cb'             // color de las lineas de conexión (azul claro)
        }
        : {
            background: '#f8fafc',
            border: '#0f172a',
            nodeBg: '#e2e8f0',
            nodeColor: '#0f172a',
            miniMapBg: '#e2e8f0',
            miniMapNode: '#0f172a',
            edgeColor: '#0f172a'
        };

    useEffect(() => {
        fetch('/assets/whatsappbotSQL.json')
            .then((res) => res.json())
            .then((data) => {
                const rawNodes = data.nodes || [];
                const rawConnections = data.connections || {};

                const formattedNodes = rawNodes.map((n) => ({
                    id: n.id,
                    position: { x: n.position[0], y: n.position[1] },
                    sourcePosition: Position.Right,
                    targetPosition: Position.Left,
                    data: {
                        label: (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div
                                    style={{
                                        background: theme.nodeBg,
                                        border: `2px solid ${theme.border}`,
                                        borderRadius: 12,
                                        width: 60,
                                        height: 60,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 40,
                                        color: theme.nodeColor,
                                    }}
                                >
                                    {getNodeIcon(n.type)}
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6, color: theme.nodeColor }}>
                                    {n.name}
                                </div>
                            </div>
                        )
                    },
                    style: {
                        background: 'transparent',
                        border: 'none',
                        width: 80,
                        height: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }
                }));

                const formattedEdges = [];

                for (const [sourceName, outputs] of Object.entries(rawConnections)) {
                    const sourceNode = rawNodes.find(n => n.name === sourceName || n.id === sourceName);
                    if (!sourceNode) continue;

                    for (const [type, connectionArrays] of Object.entries(outputs)) {
                        connectionArrays.forEach((connectionArray, outputIndex) => {
                            connectionArray.forEach((conn, connIndex) => {
                                const targetNode = rawNodes.find(n => n.name === conn.node || n.id === conn.node);
                                if (targetNode) {
                                    formattedEdges.push({
                                        id: `e-${sourceNode.id}-${targetNode.id}-${outputIndex}-${connIndex}`,
                                        source: sourceNode.id,
                                        target: targetNode.id,
                                        markerEnd: {
                                            type: MarkerType.ArrowClosed,
                                            color: theme.edgeColor,
                                        },
                                        animated: true,
                                        style: {
                                            stroke: theme.edgeColor,
                                            strokeWidth: 2,
                                        }
                                    });
                                }
                            });
                        });
                    }
                }

                setNodes(formattedNodes);
                setEdges(formattedEdges);
            });
    }, [darkMode]);

    return (
        <div style={{ height: '55vh', width: '100%', background: theme.background }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                minZoom={0.1}
                maxZoom={1.5}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                style={{ background: theme.background }}
            >
                <MiniMap style={{ backgroundColor: theme.miniMapBg }} nodeColor={() => theme.miniMapNode} zoomable pannable />
                <Background color={darkMode ? '#334155' : '#cbd5e1'} gap={20} />
                <Controls />
                <Panel position="top-right">
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${theme.border}`, background: theme.nodeBg, color: theme.nodeColor }}
                    >
                        {darkMode ? '☀ Tema claro' : '🌙 Tema oscuro'}
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
};

export default N8nFlowViewer;
