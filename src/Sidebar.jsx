import React, { useEffect, useState } from 'react';
import { useDnD } from './DnDContext';
import { useReactFlow } from '@xyflow/react';

const nodeTypes = [
  { label: 'Class', value: 'class', color: '#FFD700' },
  { label: 'Interface', value: 'interface', color: '#87CEFA' },
  { label: 'Abstract', value: 'abstract', color: '#98FB98' },
  { label: 'Enum', value: 'enum', color: '#FFA07A' },
];

const defaultEdgeConfigs = {
  ASSOCIATION: {
    label: '→ Association',
    style: { stroke: '#555', strokeWidth: 2 },
    markerEnd: 'arrow',
  },
  INHERITANCE: {
    label: '▷ Inheritance',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: 'arrowclosed',
  },
  COMPOSITION: {
    label: '◆ Composition',
    style: { stroke: '#dc2626', strokeWidth: 2 },
    markerEnd: 'diamond',
  },
  AGGREGATION: {
    label: '◇ Aggregation',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: 'diamond',
  }
};

export default ({
  nodes = [],
  setNodes = () => {},
  edges = [],
  setEdges = () => {},
  lastUpdate,
  setLastUpdate = () => {},
  selectedNodeId,
  deleteSelectedNode,
  isConnecting,
  setIsConnecting,
  selectedEdgeType,
  setSelectedEdgeType,
  connectionStart,
  setConnectionStart,
  selectedNodeType,
  setSelectedNodeType,
  edgeConfigs = defaultEdgeConfigs
}) => {
  const [_, setDnDType] = useDnD();
  const { screenToFlowPosition } = useReactFlow();
  const [jsonValue, setJsonValue] = useState('');
  const [isValidJson, setIsValidJson] = useState(true);
  const [jsonData, setJsonData] = useState('');

  useEffect(() => {
    setDnDType(selectedNodeType);
  }, [selectedNodeType, setDnDType]);

  useEffect(() => {
    const diagramData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          className: node.data.className,
          ...(node.data.attributes && { attributes: node.data.attributes }),
          ...(node.data.methods && { methods: node.data.methods })
        }
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      }))
    };
    setJsonValue(JSON.stringify(diagramData, null, 2));
  }, [nodes, edges, lastUpdate]);

  const handleJsonChange = (e) => {
    const value = e.target.value;
    setJsonValue(value);

    try {
      const parsed = JSON.parse(value);
      setIsValidJson(true);

      const updatedNodes = (parsed.nodes || []).map((node, index) => ({
        id: node.id || `node_${Date.now()}_${index}`,
        type: node.type || 'class',
        position: node.position || { x: index * 250, y: 0 },
        data: {
          className: node.data?.className || `New${(node.type || 'class').charAt(0).toUpperCase() + (node.type || 'class').slice(1)}`,
          attributes: node.data?.attributes || [{ name: 'id', type: 'string' }],
          methods: node.data?.methods || [{ name: 'toString', returnType: 'string' }]
        }
      }));

      const updatedEdges = (parsed.edges || []).map(edge => {
        const config = edgeConfigs[edge.type] || edgeConfigs.ASSOCIATION;
        return {
          id: edge.id || `edge_${Date.now()}`,
          source: edge.source,
          target: edge.target,
          type: edge.type || 'ASSOCIATION',
          markerEnd: config.markerEnd,
          style: config.style,
          data: {
            label: config.label
          }
        };
      });

      setNodes(updatedNodes);
      setEdges(updatedEdges);
    } catch (err) {
      setIsValidJson(false);
      console.error("Error parsing JSON:", err);
    }
  };

  const startConnectionMode = (edgeType) => {
    setSelectedEdgeType(edgeType);
    setIsConnecting(true);
  };

  const cancelConnectionMode = () => {
    setIsConnecting(false);
    setConnectionStart(null);
  };

  const onDragStart = (event) => {
    if (isConnecting) return;
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside style={{ width: '250px', padding: '15px', background: '#f8f9fa' }}>
      <div className="sidebar-header">
        <h3>Class Diagram Editor</h3>
        <div className="sidebar-divider"></div>
      </div>

      <div className="node-creation-section">
        <div className="description">
          Select a node type below and drag it onto the canvas.
        </div>

        <div className="node-type-selector" style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
          {nodeTypes.map((type) => (
            <button
              key={type.value}
              className={`node-type-btn ${selectedNodeType === type.value ? 'active' : ''}`}
              style={{
                backgroundColor: type.color,
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedNodeType(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div
          className="dndnode"
          onDragStart={onDragStart}
          draggable
          style={{
            backgroundColor: nodeTypes.find(t => t.value === selectedNodeType)?.color || '#FFD700',
            padding: '10px',
            borderRadius: '4px',
            margin: '15px 0',
            cursor: isConnecting ? 'not-allowed' : 'grab',
            textAlign: 'center'
          }}
        >
          {selectedNodeType?.toUpperCase() || 'CLASS'} Node
        </div>

        <button
          className="delete-btn"
          onClick={deleteSelectedNode}
          disabled={!selectedNodeId || isConnecting}
          style={{
            padding: '8px',
            width: '100%',
            backgroundColor: selectedNodeId ? '#dc3545' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedNodeId ? 'pointer' : 'not-allowed'
          }}
        >
          {selectedNodeId ? 'Delete Selected Node' : 'No Node Selected'}
        </button>
      </div>

      <div className="edge-creation-section" style={{ marginTop: '20px' }}>
        <h4>Create Relationships</h4>
        <div className="edge-type-selector" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          {Object.entries(edgeConfigs || defaultEdgeConfigs).map(([type, config]) => (
            <button
              key={type}
              className={`edge-type-btn ${selectedEdgeType === type ? 'active' : ''}`}
              onClick={() => startConnectionMode(type)}
              style={{
                border: `1px solid ${config.style.stroke}`,
                backgroundColor: isConnecting && selectedEdgeType === type ? '#f0f0f0' : 'white',
                padding: '5px',
                borderRadius: '4px',
                cursor: isConnecting && selectedEdgeType !== type ? 'not-allowed' : 'pointer',
                textAlign: 'left'
              }}
              disabled={isConnecting && selectedEdgeType !== type}
            >
              {config.label}
            </button>
          ))}
        </div>
        <div className="edge-instructions" style={{ marginTop: '10px' }}>
          {isConnecting ? (
            <div className="connecting-instruction" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div>Click on source then target node</div>
              <button
                className="cancel-connection-btn"
                onClick={cancelConnectionMode}
                style={{
                  padding: '5px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel Connection
              </button>
            </div>
          ) : (
            <div>Select relationship type to begin</div>
          )}
        </div>
      </div>

      <div className="json-editor-container" style={{ marginTop: '20px' }}>
        <h4>Diagram JSON</h4>
        <textarea
          className={`json-editor ${!isValidJson ? 'invalid' : ''}`}
          value={jsonValue}
          onChange={handleJsonChange}
          spellCheck="false"
          style={{
            width: '100%',
            height: '200px',
            fontFamily: 'monospace',
            border: isValidJson ? '1px solid #ced4da' : '1px solid #dc3545',
            borderRadius: '4px',
            padding: '8px'
          }}
          placeholder={`{\n  "nodes": [\n    {\n      "id": "node1",\n      "type": "class",\n      "position": { "x": 100, "y": 100 },\n      "data": {\n        "className": "User"\n      }\n    }\n  ],\n  "edges": [\n    {\n      "source": "node1",\n      "target": "node2",\n      "type": "ASSOCIATION"\n    }\n  ]\n}`}
        />
        {!isValidJson && (
          <div className="json-error" style={{ color: '#dc3545', marginTop: '5px' }}>
            Invalid JSON format
          </div>
        )}
      </div>
    </aside>
  );
};