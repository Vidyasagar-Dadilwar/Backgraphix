import React, { useState, useEffect } from 'react';

const EditModal = ({ isOpen, onClose, node, onSave, nodeTypes }) => {
    const [className, setClassName] = useState('');
    const [attributes, setAttributes] = useState([]);
    const [methods, setMethods] = useState([]);
    const [nodeType, setNodeType] = useState('class');

    useEffect(() => {
        if (node) {
            setClassName(node.data.className || '');
            setAttributes(node.data.attributes || []);
            setMethods(node.data.methods || []);
            setNodeType(node.type || 'class');
        }
    }, [node]);

    const handleClassNameChange = (e) => {
        setClassName(e.target.value);
    };

    const handleAttributeChange = (index, field, value) => {
        const newAttributes = [...attributes];
        newAttributes[index] = { ...newAttributes[index], [field]: value };
        setAttributes(newAttributes);
    };

    const handleMethodChange = (index, field, value) => {
        const newMethods = [...methods];
        newMethods[index] = { ...newMethods[index], [field]: value };
        setMethods(newMethods);
    };

    const addAttribute = () => {
        setAttributes([...attributes, { name: '', type: '' }]);
    };

    const addMethod = () => {
        setMethods([...methods, { name: '', returnType: '' }]);
    };

    const removeAttribute = (index) => {
        setAttributes(attributes.filter((_, i) => i !== index));
    };

    const removeMethod = (index) => {
        setMethods(methods.filter((_, i) => i !== index));
    };

    const handleTypeChange = (e) => {
        setNodeType(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const updatedNode = {
            ...node,
            type: nodeType,
            data: {
                ...node.data,
                className,
                attributes,
                methods
            }
        };

        onSave(updatedNode);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="modal-content" style={{
                backgroundColor: 'white',
                borderRadius: '5px',
                width: '80%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                padding: '20px'
            }}>
                <div className="modal-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px'
                }}>
                    <h2>Edit Node</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-section" style={{ marginBottom: '15px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                            Node Type
                        </label>
                        <select
                            value={nodeType}
                            onChange={handleTypeChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                            }}
                        >
                            {Object.keys(nodeTypes).map(type => (
                                <option key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-section" style={{ marginBottom: '15px' }}>
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                            Class Name
                        </label>
                        <input
                            type="text"
                            value={className}
                            onChange={handleClassNameChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ddd'
                            }}
                        />
                    </div>

                    <div className="form-section" style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ fontWeight: 'bold' }}>Attributes</label>
                            <button
                                type="button"
                                onClick={addAttribute}
                                style={{
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Add Attribute
                            </button>
                        </div>

                        {attributes.map((attr, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                gap: '10px',
                                marginBottom: '8px',
                                alignItems: 'center'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={attr.name}
                                    onChange={(e) => handleAttributeChange(index, 'name', e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Type"
                                    value={attr.type}
                                    onChange={(e) => handleAttributeChange(index, 'type', e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeAttribute(index)}
                                    style={{
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '5px 10px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="form-section" style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <label style={{ fontWeight: 'bold' }}>Methods</label>
                            <button
                                type="button"
                                onClick={addMethod}
                                style={{
                                    backgroundColor: '#4caf50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Add Method
                            </button>
                        </div>

                        {methods.map((method, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                gap: '10px',
                                marginBottom: '8px',
                                alignItems: 'center'
                            }}>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    value={method.name}
                                    onChange={(e) => handleMethodChange(index, 'name', e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Return Type"
                                    value={method.returnType}
                                    onChange={(e) => handleMethodChange(index, 'returnType', e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeMethod(index)}
                                    style={{
                                        backgroundColor: '#f44336',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '5px 10px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                padding: '8px 15px',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                backgroundColor: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '8px 15px',
                                cursor: 'pointer'
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditModal; 