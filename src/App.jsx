import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  useReactFlow,
  Background,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './xy-theme.css';
import Sidebar from './Sidebar';
import { DnDProvider, useDnD } from './DnDContext';
import ClassNode from './ClassNode';
import PromptInput from './PromptInput';
import { LoadingSkeleton, ErrorMessage, TabPanel, Tabs } from './UIComponents';
import { FileOperations, SavedDiagramsPanel } from './FileOperations';
import {
  AssociationEdge,
  InheritanceEdge,
  CompositionEdge,
  AggregationEdge
} from './CustomEdges';
import GeminiGenerator from './GeminiGenerator';

const nodeTypes = {
  class: ClassNode,
  interface: ClassNode,
  abstract: ClassNode,
  enum: ClassNode,
};

// Custom edge components for each relationship type
const edgeTypes = {
  ASSOCIATION: AssociationEdge,
  INHERITANCE: InheritanceEdge,
  COMPOSITION: CompositionEdge,
  AGGREGATION: AggregationEdge,
};

// Edge configurations for creating new edges
const edgeConfigs = {
  ASSOCIATION: {
    label: '→ Association',
    style: { stroke: '#555', strokeWidth: 2 },
    markerEnd: MarkerType.Arrow,
  },
  INHERITANCE: {
    label: '▷ Inheritance',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: MarkerType.ArrowClosed,
  },
  COMPOSITION: {
    label: '◆ Composition',
    style: { stroke: '#dc2626', strokeWidth: 2 },
    markerEnd: MarkerType.Diamond,
  },
  AGGREGATION: {
    label: '◇ Aggregation',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: MarkerType.Diamond,
  }
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const DnDFlow = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [selectedEdgeType, setSelectedEdgeType] = useState('ASSOCIATION');
  const [selectedNodeType, setSelectedNodeType] = useState('class');

  // New state variables
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [savedTab, setSavedTab] = useState(0);

  // Prepare nodes with onNodeUpdate function to handle updates from EditModal
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        // Add onNodeUpdate function to node data
        return {
          ...node,
          data: {
            ...node.data,
            onNodeUpdate: (updatedNode) => handleNodeUpdate(node.id, updatedNode),
          },
          selected: node.id === selectedNodeId,
        };
      })
    );
  }, [selectedNodeId, setNodes]);

  const handleNodeUpdate = useCallback((nodeId, updatedNode) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          // Apply updates from the modal
          return {
            ...node,
            type: updatedNode.type,
            data: {
              ...node.data,
              className: updatedNode.data.className,
              attributes: updatedNode.data.attributes,
              methods: updatedNode.data.methods,
              onNodeUpdate: node.data.onNodeUpdate,
            },
          };
        }
        return node;
      })
    );
    setLastUpdate(Date.now());
  }, [setNodes]);

  const onConnect = useCallback(
    (params) => {
      const edgeConfig = edgeConfigs[selectedEdgeType] || edgeConfigs.ASSOCIATION;
      const newEdge = {
        ...params,
        type: selectedEdgeType,
        markerEnd: edgeConfig.markerEnd,
        style: edgeConfig.style,
        data: {
          label: edgeConfig.label
        }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [selectedEdgeType, setEdges]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          className: `New${type.charAt(0).toUpperCase() + type.slice(1)}`,
          attributes: [
            { name: 'id', type: 'string' }
          ],
          methods: [
            { name: 'toString', returnType: 'string' }
          ],
          onNodeUpdate: (updatedNode) => handleNodeUpdate(newNode.id, updatedNode),
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setLastUpdate(Date.now());
    },
    [screenToFlowPosition, type, setNodes, handleNodeUpdate]
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNodeId));
    setEdges((eds) => eds.filter((edge) =>
      edge.source !== selectedNodeId && edge.target !== selectedNodeId
    ));
    setSelectedNodeId(null);
    setLastUpdate(Date.now());
  }, [selectedNodeId, setNodes, setEdges]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id);
    if (isConnecting) {
      if (!connectionStart) {
        setConnectionStart(node.id);
      } else if (connectionStart !== node.id) {
        const edgeConfig = edgeConfigs[selectedEdgeType];
        const newEdge = {
          id: `edge_${connectionStart}_${node.id}_${Date.now()}`,
          source: connectionStart,
          target: node.id,
          type: selectedEdgeType,
          markerEnd: edgeConfig.markerEnd,
          style: edgeConfig.style,
          data: {
            label: edgeConfig.label
          }
        };
        setEdges((eds) => [...eds, newEdge]);
        setLastUpdate(Date.now());
        setIsConnecting(false);
        setConnectionStart(null);
      }
    }
  }, [isConnecting, connectionStart, selectedEdgeType, setEdges]);

  const onPaneClick = useCallback(() => {
    if (isConnecting) {
      setIsConnecting(false);
      setConnectionStart(null);
    }
    setSelectedNodeId(null);
  }, [isConnecting]);

  const handleDiagramGenerated = useCallback((diagramData) => {
    if (diagramData?.nodes && diagramData?.edges) {
      // Add onNodeUpdate function to all generated nodes
      const nodesWithUpdater = diagramData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onNodeUpdate: (updatedNode) => handleNodeUpdate(node.id, updatedNode),
        }
      }));

      // Process edges to ensure they have the correct properties
      const processedEdges = diagramData.edges.map(edge => {
        const edgeConfig = edgeConfigs[edge.type] || edgeConfigs.ASSOCIATION;
        return {
          ...edge,
          markerEnd: edgeConfig.markerEnd,
          style: edgeConfig.style,
          data: {
            label: edgeConfig.label
          }
        };
      });

      setNodes(nodesWithUpdater);
      setEdges(processedEdges);
      setLastUpdate(Date.now());
    }
  }, [setNodes, setEdges, handleNodeUpdate]);

  const handleLoadDiagram = useCallback((diagramData) => {
    if (diagramData?.nodes && diagramData?.edges) {
      // Add onNodeUpdate function to all loaded nodes
      const nodesWithUpdater = diagramData.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onNodeUpdate: (updatedNode) => handleNodeUpdate(node.id, updatedNode),
        }
      }));

      // Process edges to ensure they have the correct properties
      const processedEdges = diagramData.edges.map(edge => {
        const edgeConfig = edgeConfigs[edge.type] || edgeConfigs.ASSOCIATION;
        return {
          ...edge,
          markerEnd: edgeConfig.markerEnd,
          style: edgeConfig.style,
          data: {
            label: edgeConfig.label
          }
        };
      });

      setNodes(nodesWithUpdater);
      setEdges(processedEdges);
      setLastUpdate(Date.now());
      // Switch to canvas tab after loading
      setActiveTab(0);
    }
  }, [setNodes, setEdges, handleNodeUpdate]);

  const getCurrentDiagram = useCallback(() => {
    return {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          className: node.data.className,
          ...(node.data.attributes && { attributes: node.data.attributes }),
          ...(node.data.methods && { methods: node.data.methods })
          // Remove onNodeUpdate function from exported data
        }
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
      }))
    };
  }, [nodes, edges]);

  const dismissError = () => {
    setError(null);
  };

  const mainPanels = ['Canvas', 'JSON'];
  const savedPanels = ['Editor', 'Saved Diagrams'];

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Top section with prompt input and file operations */}
      <div className="top-section">
        <PromptInput
          onDiagramGenerated={handleDiagramGenerated}
          setLoading={setLoading}
          setError={setError}
        />
        <FileOperations
          currentDiagram={getCurrentDiagram()}
          onLoad={handleLoadDiagram}
        />
      </div>

      {/* Main content area with tabs */}
      <div className="main-content" style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        {/* Left panel with diagram area and JSON view */}
        <div className="left-panel" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={setActiveTab}
            tabs={mainPanels}
          />

          <TabPanel value={activeTab} index={0}>
            <div className="reactflow-wrapper" ref={reactFlowWrapper} style={{ height: '100%' }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode="strict"
                fitView
                style={{ backgroundColor: "#F7F9FB" }}
                nodesDraggable={!isConnecting}
              >
                <Background />
                <Controls />
              </ReactFlow>
            </div>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <pre
              className="json-view"
              style={{
                padding: '20px',
                height: '100%',
                margin: 0,
                overflow: 'auto',
                backgroundColor: '#282c34',
                color: '#abb2bf',
                fontFamily: 'Consolas, Monaco, "Andale Mono", monospace'
              }}
            >
              {JSON.stringify(getCurrentDiagram(), null, 2)}
            </pre>
          </TabPanel>
        </div>

        {/* Right sidebar */}
        <div className="right-sidebar" style={{ width: '250px', borderLeft: '1px solid #ddd' }}>
          <Tabs
            value={savedTab}
            onChange={setSavedTab}
            tabs={savedPanels}
          />

          <TabPanel value={savedTab} index={0}>
            <Sidebar
              nodes={nodes}
              setNodes={setNodes}
              edges={edges}
              setEdges={setEdges}
              lastUpdate={lastUpdate}
              setLastUpdate={setLastUpdate}
              selectedNodeId={selectedNodeId}
              deleteSelectedNode={deleteSelectedNode}
              isConnecting={isConnecting}
              setIsConnecting={setIsConnecting}
              selectedEdgeType={selectedEdgeType}
              setSelectedEdgeType={setSelectedEdgeType}
              connectionStart={connectionStart}
              setConnectionStart={setConnectionStart}
              selectedNodeType={selectedNodeType}
              setSelectedNodeType={setSelectedNodeType}
              edgeConfigs={edgeConfigs}
            />
          </TabPanel>

          <TabPanel value={savedTab} index={1}>
            <SavedDiagramsPanel onLoad={handleLoadDiagram} />
          </TabPanel>
        </div>
      </div>

      {/* Loading indicator */}
      {loading && <LoadingSkeleton />}

      {/* Error message */}
      {error && <ErrorMessage message={error} onDismiss={dismissError} />}

      {/* Gemini Generator */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
        <GeminiGenerator diagramData={{ nodes, edges }} />
      </div>
    </div>
  );
};

export default () => (
  <ReactFlowProvider>
    <DnDProvider>
      <DnDFlow />
    </DnDProvider>
  </ReactFlowProvider>
);