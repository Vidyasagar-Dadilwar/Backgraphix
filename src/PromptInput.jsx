import React, { useState } from 'react';
import { generateDiagramFromPrompt, parseAPIResponse } from './api';

const PromptInput = ({ onDiagramGenerated, setLoading, setError }) => {
    const [prompt, setPrompt] = useState('');

    const handlePromptChange = (e) => {
        setPrompt(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        try {
            setLoading(true);
            setError(null);

            const response = await generateDiagramFromPrompt(prompt);
            const parsedData = parseAPIResponse(response);

            onDiagramGenerated(parsedData);
            setPrompt('');
        } catch (error) {
            setError(error.message || 'Failed to generate diagram');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="prompt-input-container" style={{
            padding: '15px',
            borderBottom: '1px solid #ddd',
            backgroundColor: '#f8f9fa'
        }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label htmlFor="prompt-input" style={{ fontWeight: 'bold' }}>
                    Describe your diagram
                </label>
                <textarea
                    id="prompt-input"
                    value={prompt}
                    onChange={handlePromptChange}
                    placeholder="Example: Create a class diagram for an e-commerce system with User, Product, and Order classes..."
                    rows={4}
                    style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ced4da',
                        fontFamily: 'inherit'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        backgroundColor: '#4361ee',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '10px 15px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        alignSelf: 'flex-end'
                    }}
                >
                    Generate Diagram
                </button>
            </form>
        </div>
    );
};

export default PromptInput; 