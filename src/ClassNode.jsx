import React, { useState } from 'react';
import { Handle } from '@xyflow/react';
import EditModal from './EditModal';

const ClassNode = ({ data, type, id, selected }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getTypeColor = () => {
    switch (type) {
      case 'class': return '#FFD700';
      case 'interface': return '#87CEFA';
      case 'abstract': return '#98FB98';
      case 'enum': return '#FFA07A';
      default: return '#DDD';
    }
  };

  const openEditModal = () => {
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveNode = (updatedNode) => {
    // This function will be called by the modal when saving changes
    // The parent component will handle the actual update of the node
    if (data.onNodeUpdate) {
      data.onNodeUpdate(updatedNode);
    }
  };

  const nodeTypes = {
    class: 'Class',
    interface: 'Interface',
    abstract: 'Abstract',
    enum: 'Enum'
  };

  return (
    <>
      <div
        className="class-node"
        style={{
          backgroundColor: getTypeColor(),
          border: selected ? '3px solid #333' : '2px solid #333',
          borderRadius: '5px',
          padding: '10px',
          minWidth: '200px'
        }}
      >
        <button
          onClick={openEditModal}
          style={{
            position: 'absolute',
            top: '5px',
            right: '5px',
            backgroundColor: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ✎
        </button>

        {/* Source Handle (right side) */}
        <Handle
          type="source"
          position="right"
          id={`${id}-source`}
          style={{ backgroundColor: '#555' }}
        />

        {/* Target Handle (left side) */}
        <Handle
          type="target"
          position="left"
          id={`${id}-target`}
          style={{ backgroundColor: '#555' }}
        />

        <div className="class-header" style={{ borderBottom: '1px solid #333', marginBottom: '8px', paddingBottom: '5px' }}>
          <strong>{type.toUpperCase()}:</strong> {data.className || 'Unnamed'}
        </div>

        {data.attributes?.length > 0 && (
          <div className="attributes-section">
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Attributes:</div>
            <ul style={{ margin: '5px 0', paddingLeft: '20px', listStyleType: 'none' }}>
              {data.attributes.map((attr, i) => (
                <li key={i} style={{ fontSize: '13px', marginBottom: '3px' }}>
                  {attr.name}{attr.type ? `: ${attr.type}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.methods?.length > 0 && (
          <div className="methods-section">
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>Methods:</div>
            <ul style={{ margin: '5px 0', paddingLeft: '20px', listStyleType: 'none' }}>
              {data.methods.map((method, i) => (
                <li key={i} style={{ fontSize: '13px', marginBottom: '3px' }}>
                  {method.name}(){method.returnType ? `: ${method.returnType}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <EditModal
        isOpen={isModalOpen}
        onClose={closeEditModal}
        node={{ id, type, data }}
        onSave={handleSaveNode}
        nodeTypes={nodeTypes}
      />
    </>
  );
};

export default ClassNode;