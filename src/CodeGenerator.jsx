import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const CodeGenerator = ({ currentDiagram }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateMockCode = (diagramData) => {
        const files = [];

        // Generate models
        diagramData.nodes.forEach(node => {
            const className = node.data.className;
            const modelCode = `
const mongoose = require('mongoose');

const ${className}Schema = new mongoose.Schema({
    ${node.data.attributes.map(attr =>
                `${attr.name}: { type: ${attr.type.charAt(0).toUpperCase() + attr.type.slice(1)} }`
            ).join(',\n    ')}
}, { timestamps: true });

module.exports = mongoose.model('${className}', ${className}Schema);`;

            files.push({
                path: `models/${className}.js`,
                content: modelCode.trim()
            });

            // Generate controller
            const controllerCode = `
const ${className} = require('../models/${className}');

exports.getAll = async (req, res) => {
    try {
        const items = await ${className}.find();
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getOne = async (req, res) => {
    try {
        const item = await ${className}.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const item = new ${className}(req.body);
        const newItem = await item.save();
        res.status(201).json(newItem);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const item = await ${className}.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!item) return res.status(404).json({ message: 'Not found' });
        res.json(item);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const item = await ${className}.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};`;

            files.push({
                path: `controllers/${className}Controller.js`,
                content: controllerCode.trim()
            });

            // Generate routes
            const routeCode = `
const express = require('express');
const router = express.Router();
const ${className}Controller = require('../controllers/${className}Controller');

router.get('/', ${className}Controller.getAll);
router.get('/:id', ${className}Controller.getOne);
router.post('/', ${className}Controller.create);
router.put('/:id', ${className}Controller.update);
router.delete('/:id', ${className}Controller.delete);

module.exports = router;`;

            files.push({
                path: `routes/${className}Routes.js`,
                content: routeCode.trim()
            });
        });

        // Generate db.js
        const dbCode = `
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

module.exports = connectDB;`;

        files.push({
            path: 'config/db.js',
            content: dbCode.trim()
        });

        // Generate app.js
        const routeImports = diagramData.nodes
            .map(node => `const ${node.data.className}Routes = require('./routes/${node.data.className}Routes');`)
            .join('\n');

        const routeUses = diagramData.nodes
            .map(node => `app.use('/api/${node.data.className.toLowerCase()}', ${node.data.className}Routes);`)
            .join('\n');

        const appCode = `
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

${routeImports}

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
${routeUses}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});`;

        files.push({
            path: 'app.js',
            content: appCode.trim()
        });

        return files;
    };

    const createZipFile = async (files) => {
        const zip = new JSZip();

        // Add files to zip
        files.forEach(({ path, content }) => {
            zip.file(path, content);
        });

        // Generate README.md
        const readme = `# Generated Backend
This backend was automatically generated from your UML diagram.

## Setup
1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Create a .env file with:
\`\`\`
MONGODB_URI=your_mongodb_uri
PORT=3000
\`\`\`

3. Run the server:
\`\`\`bash
npm start
\`\`\`
`;
        zip.file('README.md', readme);

        // Add package.json
        const packageJson = {
            name: "generated-backend",
            version: "1.0.0",
            main: "app.js",
            scripts: {
                start: "node app.js",
                dev: "nodemon app.js"
            },
            dependencies: {
                "express": "^4.18.2",
                "mongoose": "^7.5.0",
                "dotenv": "^16.3.1",
                "cors": "^2.8.5"
            },
            devDependencies: {
                "nodemon": "^3.0.1"
            }
        };
        zip.file('package.json', JSON.stringify(packageJson, null, 2));

        // Generate zip file
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        return zipBlob;
    };

    const handleGenerateCode = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Use mock generation instead of API call
            const files = generateMockCode(currentDiagram);

            if (files.length === 0) {
                throw new Error('No files were generated');
            }

            const zipBlob = await createZipFile(files);
            saveAs(zipBlob, 'generated-backend.zip');
        } catch (err) {
            setError(err.message || 'Failed to generate code');
            console.error('Code generation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ marginRight: '10px' }}>
            <button
                onClick={handleGenerateCode}
                disabled={isLoading}
                style={{
                    padding: '8px 12px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                {isLoading ? (
                    <>
                        <span className="spinner" style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #ffffff',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                        }}></span>
                        Generating...
                    </>
                ) : (
                    'Generate Backend'
                )}
            </button>
            {error && (
                <div style={{
                    color: '#dc2626',
                    fontSize: '14px',
                    marginTop: '8px'
                }}>
                    {error}
                </div>
            )}
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default CodeGenerator; 