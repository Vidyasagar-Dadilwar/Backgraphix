import React, { useRef } from 'react';
import CodeGenerator from './CodeGenerator';

export const FileOperations = ({ onSave, onLoad, currentDiagram }) => {
    const fileInputRef = useRef(null);

    const handleExportClick = () => {
        if (!currentDiagram) return;

        const dataStr = JSON.stringify(currentDiagram, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

        const exportFileDefaultName = `diagram-${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                onLoad(json);
            } catch (error) {
                console.error('Error parsing uploaded file:', error);
                alert('The file is not a valid JSON diagram file');
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    };

    const saveToLocalStorage = () => {
        if (!currentDiagram) return;

        const savedDiagrams = JSON.parse(localStorage.getItem('savedDiagrams') || '{}');

        const diagramName = prompt('Enter a name for this diagram:');
        if (!diagramName) return;

        savedDiagrams[diagramName] = currentDiagram;
        localStorage.setItem('savedDiagrams', JSON.stringify(savedDiagrams));

        alert(`Diagram "${diagramName}" saved successfully!`);
    };

    return (
        <div className="file-operations" style={{
            display: 'flex',
            gap: '10px',
            padding: '10px 15px',
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f8f9fa'
        }}>
            <CodeGenerator currentDiagram={currentDiagram} />

            <button
                onClick={saveToLocalStorage}
                style={{
                    padding: '8px 12px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Save Diagram
            </button>

            <button
                onClick={handleExportClick}
                style={{
                    padding: '8px 12px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Export as JSON
            </button>

            <button
                onClick={handleUploadClick}
                style={{
                    padding: '8px 12px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Import Diagram
            </button>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                style={{ display: 'none' }}
            />
        </div>
    );
};

export const SavedDiagramsPanel = ({ onLoad }) => {
    const [savedDiagrams, setSavedDiagrams] = React.useState({});

    React.useEffect(() => {
        const diagrams = JSON.parse(localStorage.getItem('savedDiagrams') || '{}');
        setSavedDiagrams(diagrams);
    }, []);

    const loadDiagram = (diagramName) => {
        onLoad(savedDiagrams[diagramName]);
    };

    const deleteDiagram = (diagramName, e) => {
        e.stopPropagation();

        if (confirm(`Are you sure you want to delete "${diagramName}"?`)) {
            const updatedDiagrams = { ...savedDiagrams };
            delete updatedDiagrams[diagramName];

            localStorage.setItem('savedDiagrams', JSON.stringify(updatedDiagrams));
            setSavedDiagrams(updatedDiagrams);
        }
    };

    return (
        <div className="saved-diagrams-panel" style={{ padding: '15px' }}>
            <h3>Saved Diagrams</h3>

            {Object.keys(savedDiagrams).length === 0 ? (
                <p>No saved diagrams found.</p>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {Object.keys(savedDiagrams).map((name) => (
                        <li
                            key={name}
                            onClick={() => loadDiagram(name)}
                            style={{
                                padding: '10px',
                                margin: '5px 0',
                                backgroundColor: '#f1f1f1',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span>{name}</span>
                            <button
                                onClick={(e) => deleteDiagram(name, e)}
                                style={{
                                    backgroundColor: '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '5px 10px',
                                    cursor: 'pointer'
                                }}
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}; 