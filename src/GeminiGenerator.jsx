"use client"

import { useState, useEffect } from "react"
import { GoogleGenerativeAI } from "@google/generative-ai"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { LoadingSkeleton, ErrorMessage } from "./UIComponents"
import "./gemini-generator.css"

const GeminiGenerator = ({ diagramData }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [generatedFiles, setGeneratedFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isExpanded])

  // Close on escape key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape" && isExpanded) {
        setIsExpanded(false)
      }
    }

    window.addEventListener("keydown", handleEsc)

    return () => {
      window.removeEventListener("keydown", handleEsc)
    }
  }, [isExpanded])

  // All existing functions remain the same
  const generatePrompt = (diagram) => {
    const { nodes, edges } = diagram

    // Extract class information with better relationship handling
    const classes = nodes.map((node) => ({
      name: node.data.className,
      type: node.type,
      attributes: node.data.attributes || [],
      methods: node.data.methods || [],
      relationships: edges
        .filter((edge) => edge.source === node.id || edge.target === node.id)
        .map((edge) => ({
          type: edge.type,
          withClass: nodes.find((n) => n.id === (edge.source === node.id ? edge.target : edge.source))?.data.className,
          direction: edge.source === node.id ? "outgoing" : "incoming",
        })),
    }))

    return `You are a senior backend developer. Generate a complete, production-ready Node.js/Express/Mongoose backend based on this UML diagram. Include advanced features like authentication, validation, error handling, and proper relationship management.

Detailed Class Information:
${classes
        .map(
          (cls) => `
Class: ${cls.name} (${cls.type})
  Attributes:
${cls.attributes.map((attr) => `  - ${attr.name}: ${attr.type}`).join("\n")}
  Methods:
${cls.methods.map((method) => `  - ${method.name}(): ${method.returnType}`).join("\n")}
Relationships:
${cls.relationships
              .map((rel) => `  - ${rel.direction === "outgoing" ? "Has" : "Belongs to"} ${rel.type} with ${rel.withClass}`)
              .join("\n")}
`,
        )
        .join("\n")}

Required Features:
1. Advanced Mongoose Schemas:
   - Proper data validation and sanitization
   - Custom methods and statics
   - Middleware (pre/post hooks)
   - Virtual fields
   - Complex relationship handling
   - Indexing for performance
   - Timestamps and audit fields

2. Comprehensive Controllers:
   - Full CRUD operations with proper error handling
   - Advanced querying (filtering, sorting, pagination)
   - Relationship management (add/remove/update related entities)
   - File upload handling (if needed)
   - Bulk operations
   - Transaction support for complex operations
   - Caching implementation
   - Rate limiting

3. Secure and RESTful Routes:
   - Authentication middleware
   - Role-based access control
   - Input validation middleware
   - Rate limiting middleware
   - Request logging
   - API versioning
   - Swagger documentation

4. Additional Features:
   - Error handling middleware
   - Request validation using express-validator
   - Response formatting middleware
   - Logging service
   - Email service integration
   - File upload service
   - Caching service
   - Background job processing

Format each file with proper documentation, error handling, and best practices. Include unit tests for critical functionality.

Response Format (JSON array):
[
    {
        "filename": "path/to/file.js",
        "type": "file_type",
        "content": "complete_file_content"
    }
]

Generate complete, production-ready code for each file. Include proper error handling, validation, and documentation.`
  }

  // Keep all other helper functions the same
  const getRelationshipSymbol = (type) => {
    switch (type) {
      case "INHERITANCE":
        return "▷"
      case "COMPOSITION":
        return "◆"
      case "AGGREGATION":
        return "◇"
      case "ASSOCIATION":
        return "→"
      default:
        return "→"
    }
  }

  const processResponse = (response) => {
    try {
      console.log("Processing response:", response)
      const text = response.text()
      if (!text) {
        throw new Error("Empty response")
      }

      // Clean up response text - replace backticks with regular quotes
      let cleanText = text

      // Remove markdown code blocks if present
      cleanText = cleanText.replace(/```json\s+/g, "")
      cleanText = cleanText.replace(/```\s*/g, "")

      // Replace backticks with double quotes
      cleanText = cleanText.replace(/`/g, '"')

      console.log("Cleaned text:", cleanText)

      // Try to parse the response as JSON
      try {
        const parsed = JSON.parse(cleanText)
        if (!Array.isArray(parsed)) {
          throw new Error("Response is not an array")
        }
        return parsed
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)

        // Try to extract the array part
        const arrayMatch = cleanText.match(/\[\s*\{[\s\S]*\}\s*\]/)
        if (arrayMatch) {
          try {
            const parsed = JSON.parse(arrayMatch[0])
            if (Array.isArray(parsed)) {
              return parsed
            }
          } catch (e) {
            console.error("Failed to parse array match:", e)
          }
        }

        // If that fails, try to extract individual file objects
        try {
          const fileObjects = []
          const regex =
            /{[\s\S]*?"filename"\s*:\s*"[^"]+?"[\s\S]*?"type"\s*:\s*"[^"]+?"[\s\S]*?"content"\s*:\s*"[\s\S]*?}/g
          const matches = cleanText.match(regex)

          if (matches) {
            for (const match of matches) {
              try {
                // Normalize JSON properties and escape newlines in content
                const normalizedMatch = match
                  .replace(/(\w+)\s*:/g, '"$1":') // Add quotes to property names
                  .replace(/:\s*"([^"]*)"/g, (m, p1) => {
                    // Escape newlines and other special chars in content
                    return ':"' + p1.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") + '"'
                  })

                const fileObj = JSON.parse(normalizedMatch)
                if (fileObj.filename && fileObj.type && fileObj.content) {
                  fileObjects.push(fileObj)
                }
              } catch (e) {
                console.error("Failed to parse individual file object:", e)
              }
            }
          }

          if (fileObjects.length > 0) {
            return fileObjects
          }
        } catch (e) {
          console.error("Failed to extract file objects:", e)
        }

        // Final fallback: manually construct file objects
        const fallbackFiles = []
        const filenameMatches = cleanText.match(/"filename"\s*:\s*"([^"]+)"/g)
        const typeMatches = cleanText.match(/"type"\s*:\s*"([^"]+)"/g)
        const contentMatches = cleanText.match(/"content"\s*:\s*"([^"]+)"/g)

        if (filenameMatches && typeMatches && contentMatches) {
          for (let i = 0; i < Math.min(filenameMatches.length, typeMatches.length, contentMatches.length); i++) {
            try {
              const filename = filenameMatches[i].match(/"filename"\s*:\s*"([^"]+)"/)[1]
              const type = typeMatches[i].match(/"type"\s*:\s*"([^"]+)"/)[1]
              const content = contentMatches[i].match(/"content"\s*:\s*"([^"]+)"/)[1]

              fallbackFiles.push({
                filename,
                type,
                content,
              })
            } catch (e) {
              console.error("Failed to extract file properties:", e)
            }
          }
        }

        if (fallbackFiles.length > 0) {
          return fallbackFiles
        }

        throw new Error("Could not extract valid files from response")
      }
    } catch (err) {
      console.error("Error processing response:", err)
      throw new Error("Failed to process response: " + err.message)
    }
  }

  // Keep all other helper functions the same
  const generateSwaggerConfig = (diagram) => {
    return `const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Generated API Documentation',
            version: '1.0.0',
            description: 'API documentation for generated backend',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
        ],
    },
    apis: ['./routes/*.js'], // Path to the API routes
};

module.exports = swaggerJsdoc(options);`
  }

  const generateErrorClasses = () => {
    return `class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = \`\${statusCode}\`.startsWith('4') ? 'fail' : 'error';
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400);
        this.errors = errors;
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

module.exports = {
    AppError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError
};`
  }

  const generateEmailService = () => {
    return `const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
    }

    async sendEmail(to, subject, html) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to,
                subject,
                html
            });
            return info;
        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();`
  }

  const generateCacheService = () => {
    return `const Redis = require('ioredis');

class CacheService {
    constructor() {
        this.redis = new Redis({
            host: process.env.REDIS_HOST,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        });
    }

    async get(key) {
        try {
            const value = await this.redis.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('Cache get failed:', error);
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
            return true;
        } catch (error) {
            console.error('Cache set failed:', error);
            return false;
        }
    }

    async del(key) {
        try {
            await this.redis.del(key);
            return true;
        } catch (error) {
            console.error('Cache delete failed:', error);
            return false;
        }
    }
}

module.exports = new CacheService();`
  }

  const generateEnvFile = () => {
    return {
      filename: ".env",
      type: "config",
      content: `PORT=3000
MONGODB_URI=mongodb://localhost:27017/your_database_name
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d`
    };
  };

  const handleGenerateCode = async () => {
    try {
      setLoading(true);
      setError(null);

      let files = [];

      if (diagramData?.nodes?.length > 0) {
        // Generate code using Gemini AI
        const prompt = generatePrompt(diagramData);

        // Configure Gemini with API key and safety settings
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-pro",
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_NONE",
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_NONE",
            },
          ],
        });

        try {
          // Generate content with proper configuration
          const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          });

          const response = await result.response;
          files = processResponse({ text: () => response.text() });
        } catch (error) {
          console.error("AI Generation failed:", error);
          // Fallback to template-based generation
          files = generateFallbackFiles(diagramData);
        }
      } else {
        setError("No diagram data available");
        return;
      }

      // Add additional files with middleware and other configurations
      const additionalFiles = [
        ...generateMiddleware(),
        {
          filename: "config/db.js",
          type: "config",
          content: generateDbConfig()
        },
        {
          filename: "middleware/errorHandler.js",
          type: "middleware",
          content: generateErrorMiddleware()
        },
        {
          filename: "utils/errors.js",
          type: "utils",
          content: generateErrorClasses()
        },
        {
          filename: "services/email.js",
          type: "service",
          content: generateEmailService()
        },
        {
          filename: "services/cache.js",
          type: "service",
          content: generateCacheService()
        },
        generateEnvFile(),
        generatePackageJson(),
        generateReadme()
      ];

      // Combine AI generated files with additional files
      files = [...files, ...additionalFiles];

      // Add index.js last to ensure it has access to all routes
      files.push(generateIndexJs(files));

      setGeneratedFiles(files || []);
      setSelectedFile(files?.[0] || null);
      setLoading(false);
    } catch (error) {
      console.error("Code generation error:", error);
      setError(error.message);
      setLoading(false);
    }
  };

  const generateFallbackFiles = (diagram) => {
    return diagram.nodes.flatMap((node) => {
      const className = node.data.className
      const attributes = node.data.attributes || []
      const relationships = diagram.edges.filter((edge) => {
        const sourceNode = diagram.nodes.find((n) => n.id === edge.source)
        const targetNode = diagram.nodes.find((n) => n.id === edge.target)
        return (
          (sourceNode && sourceNode.data.className === className) ||
          (targetNode && targetNode.data.className === className)
        )
      })

      return [
        {
          filename: `models/${className}.js`,
          type: "schema",
          content: generateSchemaTemplate(className, attributes, relationships, diagram.nodes),
        },
        {
          filename: `controllers/${className}Controller.js`,
          type: "controller",
          content: generateControllerTemplate(className, relationships, diagram.nodes),
        },
        {
          filename: `routes/${className}Routes.js`,
          type: "route",
          content: generateRouteTemplate(className, relationships, diagram.nodes),
        },
      ]
    })
  }

  const generateSchemaTemplate = (className, attributes, relationships = [], nodes = []) => {
    const schemaFields = [];
    const imports = new Set();

    // Add regular attributes
    attributes.forEach((attr) => {
      let type = "String";
      if (["number", "Number"].includes(attr.type)) type = "Number";
      if (["boolean", "Boolean"].includes(attr.type)) type = "Boolean";
      if (["date", "Date"].includes(attr.type)) type = "Date";

      schemaFields.push(`  ${attr.name}: {
    type: ${type},
    required: true
  }`);
    });

    // Handle relationships
    relationships.forEach((rel) => {
      const targetNode = nodes.find((n) => n.id === rel.target);
      const sourceNode = nodes.find((n) => n.id === rel.source);

      if (!targetNode || !sourceNode) return;

      const relatedClass = targetNode.data.className === className ? sourceNode.data.className : targetNode.data.className;

      switch (rel.type) {
        case "COMPOSITION":
          // For composition, we'll use subdocuments
          schemaFields.push(`  ${relatedClass.toLowerCase()}: {
    type: {
      // Define embedded schema here instead of importing
      name: { type: String, required: true },
      // Add other fields as needed
    },
    required: true
  }`);
          break;

        case "AGGREGATION":
          schemaFields.push(`  ${relatedClass.toLowerCase()}s: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: '${relatedClass}'
  }]`);
          imports.add(relatedClass);
          break;

        case "ASSOCIATION":
          schemaFields.push(`  ${relatedClass.toLowerCase()}: {
    type: mongoose.Schema.Types.ObjectId,
    ref: '${relatedClass}'
  }`);
          imports.add(relatedClass);
          break;

        case "INHERITANCE":
          // Handle inheritance through discriminator pattern
          break;
      }
    });

    // Generate imports
    const importStatements = Array.from(imports)
      .map(model => `const ${model} = require('./${model}');`)
      .join('\n');

    return `const mongoose = require('mongoose');
const { Schema } = mongoose;
${importStatements}

const ${className}Schema = new Schema({
${schemaFields.join(",\n\n")},

  // Common fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true${relationships.some((r) => r.type === "INHERITANCE") ? ",\n  discriminatorKey: 'kind'" : ""}
});

// Add indexes
${className}Schema.index({ createdAt: -1 });
${attributes
        .filter((attr) => attr.type === "String")
        .map((attr) => `${className}Schema.index({ ${attr.name}: 'text' });`)
        .join("\n")}

// Add methods
${className}Schema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('${className}', ${className}Schema);`;
  }

  const generateControllerTemplate = (className, relationships = [], nodes = []) => {
    // Check if this class has any relationships that need special handling
    const hasChildren = relationships.some((rel) => {
      const targetNode = nodes.find((n) => n.id === rel.target)
      return rel.type === "INHERITANCE" && targetNode?.data.className === className
    })

    const hasRelationships = relationships.some((rel) => {
      const sourceNode = nodes.find((n) => n.id === rel.source)
      return sourceNode?.data.className === className && ["ASSOCIATION", "AGGREGATION"].includes(rel.type)
    })

    // Get reference fields that should be populated
    const populateFields = relationships
      .filter((rel) => {
        const sourceNode = nodes.find((n) => n.id === rel.source)
        const targetNode = nodes.find((n) => n.id === rel.target)

        if (!sourceNode || !targetNode) return false

        const sourceClass = sourceNode.data.className
        const targetClass = targetNode.data.className

        return (
          (sourceClass === className && ["ASSOCIATION", "AGGREGATION"].includes(rel.type)) ||
          (targetClass === className && rel.type === "ASSOCIATION")
        )
      })
      .map((rel) => {
        const sourceNode = nodes.find((n) => n.id === rel.source)
        const targetNode = nodes.find((n) => n.id === rel.target)

        const sourceClass = sourceNode.data.className
        const targetClass = targetNode.data.className

        if (sourceClass === className) {
          return rel.type === "AGGREGATION" ? `${targetClass.toLowerCase()}s` : targetClass.toLowerCase()
        } else {
          return sourceClass.toLowerCase()
        }
      })

    // Create populate string if needed
    const populateString = populateFields.length ? `.populate('${populateFields.join("').populate('")}')` : ""

    return `const ${className} = require('../models/${className}');

/**
 * Get all ${className}s
 * @route GET /api/${className.toLowerCase()}s
 */
exports.getAll = async (req, res) => {
  try {
    const ${className.toLowerCase()}s = await ${className}.find()${populateString};
    res.status(200).json(${className.toLowerCase()}s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get one ${className}
 * @route GET /api/${className.toLowerCase()}s/:id
 */
exports.getOne = async (req, res) => {
  try {
    const ${className.toLowerCase()} = await ${className}.findById(req.params.id)${populateString};
    if (!${className.toLowerCase()}) {
      return res.status(404).json({ message: '${className} not found' });
    }
    res.status(200).json(${className.toLowerCase()});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Create a ${className}
 * @route POST /api/${className.toLowerCase()}s
 */
exports.create = async (req, res) => {
  const ${className.toLowerCase()} = new ${className}(req.body);
  try {
    const new${className} = await ${className.toLowerCase()}.save();
    res.status(201).json(new${className});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Update a ${className}
 * @route PUT /api/${className.toLowerCase()}s/:id
 */
exports.update = async (req, res) => {
  try {
    const ${className.toLowerCase()} = await ${className}.findById(req.params.id);
    if (!${className.toLowerCase()}) {
      return res.status(404).json({ message: '${className} not found' });
    }
    
    const updated${className} = await ${className}.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )${populateString};
    res.status(200).json(updated${className});
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Delete a ${className}
 * @route DELETE /api/${className.toLowerCase()}s/:id
 */
exports.delete = async (req, res) => {
  try {
    const ${className.toLowerCase()} = await ${className}.findById(req.params.id);
    if (!${className.toLowerCase()}) {
      return res.status(404).json({ message: '${className} not found' });
    }
    ${hasChildren ? `\n    // This is a parent class, cascade delete might be needed for child documents\n    ` : ""}
    await ${className}.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: '${className} deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
${hasRelationships
        ? `
/**
 * Add a related item to ${className}
 * @route POST /api/${className.toLowerCase()}s/:id/related/:relatedId
 */
exports.addRelated = async (req, res) => {
  try {
    const { id, relatedId } = req.params;
    const { relationField } = req.body;
    
    if (!relationField) {
      return res.status(400).json({ message: 'Relation field is required' });
    }
    
    const ${className.toLowerCase()} = await ${className}.findById(id);
    if (!${className.toLowerCase()}) {
      return res.status(404).json({ message: '${className} not found' });
    }
    
    // Handle array relationships
    if (Array.isArray(${className.toLowerCase()}[relationField])) {
      if (!${className.toLowerCase()}[relationField].includes(relatedId)) {
        ${className.toLowerCase()}[relationField].push(relatedId);
      }
    } else {
      // Handle single reference relationships
      ${className.toLowerCase()}[relationField] = relatedId;
    }
    
    await ${className.toLowerCase()}.save();
    
    const updated${className} = await ${className}.findById(id)${populateString};
    res.status(200).json(updated${className});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Remove a related item from ${className}
 * @route DELETE /api/${className.toLowerCase()}s/:id/related/:relatedId
 */
exports.removeRelated = async (req, res) => {
  try {
    const { id, relatedId } = req.params;
    const { relationField } = req.body;
    
    if (!relationField) {
      return res.status(400).json({ message: 'Relation field is required' });
    }
    
    const ${className.toLowerCase()} = await ${className}.findById(id);
    if (!${className.toLowerCase()}) {
      return res.status(404).json({ message: '${className} not found' });
    }
    
    // Handle array relationships
    if (Array.isArray(${className.toLowerCase()}[relationField])) {
      ${className.toLowerCase()}[relationField] = ${className.toLowerCase()}[relationField].filter(
        item => item.toString() !== relatedId
      );
    } else {
      // Handle single reference relationships
      if (${className.toLowerCase()}[relationField] && ${className.toLowerCase()}[relationField].toString() === relatedId) {
        ${className.toLowerCase()}[relationField] = null;
      }
    }
    
    await ${className.toLowerCase()}.save();
    
    const updated${className} = await ${className}.findById(id)${populateString};
    res.status(200).json(updated${className});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};`
        : ""
      }`
  }

  const generateRouteTemplate = (className, relationships = [], nodes = []) => {
    return `const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const ${className}Controller = require('../controllers/${className}Controller');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/checkRole');
const validate = require('../middleware/validate');
const rateLimiter = require('../middleware/rateLimiter');

// Validation schemas
const createValidation = [
    ${generateValidationRules(className, relationships, nodes)}
];

const updateValidation = [
    ${generateValidationRules(className, relationships, nodes)}
];

/**
 * @swagger
 * /api/${className.toLowerCase()}s:
 *   get:
 *     summary: Get all ${className}s
 */
router.get('/',
    rateLimiter,
    ${className}Controller.getAll
);

/**
 * @swagger
 * /api/${className.toLowerCase()}s/{id}:
 *   get:
 *     summary: Get a single ${className}
 */
router.get('/:id',
    rateLimiter,
    param('id').isMongoId(),
    validate,
    ${className}Controller.getOne
);

/**
 * @swagger
 * /api/${className.toLowerCase()}s:
 *   post:
 *     summary: Create a new ${className}
 */
router.post('/',
    auth,
    checkRole(['admin']),
    rateLimiter,
    createValidation,
    validate,
    ${className}Controller.create
);

/**
 * @swagger
 * /api/${className.toLowerCase()}s/{id}:
 *   put:
 *     summary: Update a ${className}
 */
router.put('/:id',
    auth,
    checkRole(['admin']),
    rateLimiter,
    param('id').isMongoId(),
    updateValidation,
    validate,
    ${className}Controller.update
);

/**
 * @swagger
 * /api/${className.toLowerCase()}s/{id}:
 *   delete:
 *     summary: Delete a ${className}
 */
router.delete('/:id',
    auth,
    checkRole(['admin']),
    rateLimiter,
    param('id').isMongoId(),
    validate,
    ${className}Controller.delete
);

${relationships.map((rel) => {
      const targetNode = nodes.find((n) => n.id === rel.target);
      const sourceNode = nodes.find((n) => n.id === rel.source);
      const relatedClass = targetNode?.data.className === className ? sourceNode?.data.className : targetNode?.data.className;

      if (!relatedClass) return "";

      return `
/**
 * @swagger
 * /api/${className.toLowerCase()}s/{id}/${relatedClass.toLowerCase()}s:
 *   get:
 *     summary: Get all related ${relatedClass}s
 */
router.get('/:id/${relatedClass.toLowerCase()}s',
    rateLimiter,
    param('id').isMongoId(),
    validate,
    async (req, res) => {
      try {
        const ${className.toLowerCase()} = await ${className}.findById(req.params.id).populate('${relatedClass.toLowerCase()}s');
        if (!${className.toLowerCase()}) {
          return res.status(404).json({ message: '${className} not found' });
        }
        res.json(${className.toLowerCase()}.${relatedClass.toLowerCase()}s);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
);

/**
 * @swagger
 * /api/${className.toLowerCase()}s/{id}/${relatedClass.toLowerCase()}s/{relatedId}:
 *   post:
 *     summary: Add a ${relatedClass} relationship
 */
router.post('/:id/${relatedClass.toLowerCase()}s/:relatedId',
    auth,
    checkRole(['admin']),
    rateLimiter,
    [param('id').isMongoId(), param('relatedId').isMongoId()],
    validate,
    async (req, res) => {
      try {
        const ${className.toLowerCase()} = await ${className}.findById(req.params.id);
        if (!${className.toLowerCase()}) {
          return res.status(404).json({ message: '${className} not found' });
        }

        const ${relatedClass.toLowerCase()} = await ${relatedClass}.findById(req.params.relatedId);
        if (!${relatedClass.toLowerCase()}) {
          return res.status(404).json({ message: '${relatedClass} not found' });
        }

        if (!${className.toLowerCase()}.${relatedClass.toLowerCase()}s.includes(req.params.relatedId)) {
          ${className.toLowerCase()}.${relatedClass.toLowerCase()}s.push(req.params.relatedId);
          await ${className.toLowerCase()}.save();
        }

        res.json(${className.toLowerCase()});
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
);

/**
 * @swagger
 * /api/${className.toLowerCase()}s/{id}/${relatedClass.toLowerCase()}s/{relatedId}:
 *   delete:
 *     summary: Remove a ${relatedClass} relationship
 */
router.delete('/:id/${relatedClass.toLowerCase()}s/:relatedId',
    auth,
    checkRole(['admin']),
    rateLimiter,
    [param('id').isMongoId(), param('relatedId').isMongoId()],
    validate,
    async (req, res) => {
      try {
        const ${className.toLowerCase()} = await ${className}.findById(req.params.id);
        if (!${className.toLowerCase()}) {
          return res.status(404).json({ message: '${className} not found' });
        }

        ${className.toLowerCase()}.${relatedClass.toLowerCase()}s = ${className.toLowerCase()}.${relatedClass.toLowerCase()}s.filter(
          id => id.toString() !== req.params.relatedId
        );
        await ${className.toLowerCase()}.save();

        res.json(${className.toLowerCase()});
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    }
);`
    }).join('\n')}

module.exports = router;`
  }

  const generateValidationRules = (className, relationships, nodes) => {
    const rules = []

    // Add validation rules based on attributes and relationships
    nodes
      .find((n) => n.data.className === className)
      ?.data.attributes?.forEach((attr) => {
        switch (attr.type.toLowerCase()) {
          case "string":
            rules.push(`body('${attr.name}').trim().notEmpty().isString()`)
            break
          case "number":
            rules.push(`body('${attr.name}').isNumeric()`)
            break
          case "boolean":
            rules.push(`body('${attr.name}').isBoolean()`)
            break
          case "date":
            rules.push(`body('${attr.name}').isISO8601()`)
            break
          // Add more types as needed
        }
      })

    return rules.join(",\n    ")
  }

  const generatePackageJson = () => {
    return {
      filename: "package.json",
      type: "config",
      content: `{
  "name": "generated-backend",
  "version": "1.0.0",
  "description": "Generated backend with complex model relationships",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.0.3",
    "morgan": "^1.10.0",
    "express-rate-limit": "^6.7.0",
    "ioredis": "^5.3.2",
    "nodemailer": "^6.9.1"
  },
  "devDependencies": {
    "jest": "^29.5.0",
    "nodemon": "^2.0.22",
    "supertest": "^6.3.3"
  }
}`
    };
  };

  const generateReadme = () => {
    return `# Generated Backend

This backend was automatically generated from a UML diagram.

## Project Structure
- \`models/\`: Mongoose schemas
- \`controllers/\`: Express controllers with CRUD operations
- \`routes/\`: Express routes
- \`config/\`: Configuration files
- \`middleware/\`: Express middleware

## Setup Instructions
1. Install dependencies: \`npm install\`
2. Create a \`.env\` file based on \`.env.sample\`
3. Start the server: \`npm run dev\`

## API Endpoints
The API includes CRUD operations for each entity in the UML diagram.
`
  }

  const generateDbConfig = () => {
    return `const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};

module.exports = connectDB;`
  }

  const generateErrorMiddleware = () => {
    return `const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;`
  }

  const downloadFiles = async () => {
    try {
      const zip = new JSZip();

      // Create folders first
      const folders = new Set();
      generatedFiles.forEach(file => {
        if (file && file.filename) {
          const parts = file.filename.split('/');
          if (parts.length > 1) {
            folders.add(parts[0]);
          }
        }
      });

      // Create all folders
      folders.forEach(folder => {
        zip.folder(folder);
      });

      // Add files to appropriate locations
      generatedFiles.forEach(file => {
        if (file && file.filename && file.content) {
          zip.file(file.filename, file.content);
        }
      });

      // Generate and save the zip
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "generated-backend.zip");
    } catch (err) {
      console.error("Error generating zip:", err);
      setError("Failed to generate zip file");
    }
  };

  const generateIndexJs = (files) => {
    return {
      filename: "index.js",
      type: "server",
      content: `const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Import routes
${files
          .filter((f) => f.type === "route")
          .map((f) => {
            const routeName = f.filename.replace(".js", "").split("/").pop();
            return `const ${routeName} = require('./routes/${routeName}');`;
          })
          .join("\n")}

// Import error middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
${files
          .filter((f) => f.type === "route")
          .map((f) => {
            const routeName = f.filename.replace(".js", "").split("/").pop();
            return `app.use('/api/${routeName.toLowerCase()}', ${routeName});`;
          })
          .join("\n")}

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(\`Server is running on port \${PORT}\`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
      // Close server & exit process
      server.close(() => process.exit(1));
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });`
    };
  }

  const generateMiddleware = () => {
    return [
      {
        filename: "middleware/auth.js",
        type: "middleware",
        content: `const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');

module.exports = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            throw new UnauthorizedError('Authentication required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        next(new UnauthorizedError('Invalid or expired token'));
    }
};`,
      },
      {
        filename: "middleware/checkRole.js",
        type: "middleware",
        content: `const { ForbiddenError } = require('../utils/errors');

module.exports = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            next(new ForbiddenError('Insufficient permissions'));
            return;
        }
        next();
    };
};`,
      },
      {
        filename: "middleware/validate.js",
        type: "middleware",
        content: `const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

module.exports = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        next(new ValidationError('Validation failed', errors.array()));
        return;
    }
    next();
};`,
      },
      {
        filename: "middleware/rateLimiter.js",
        type: "middleware",
        content: `const rateLimit = require('express-rate-limit');

module.exports = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});`,
      },
    ]
  }

  // Handle click outside to close modal
  const handleOverlayClick = (e) => {
    if (e.target.className === "gemini-generator-overlay") {
      setIsExpanded(false)
    }
  }

  return (
    <div className="gemini-generator">
      {/* Floating button */}
      <button onClick={() => setIsExpanded(!isExpanded)} className="gemini-generator-button">
        {isExpanded ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="#4361ee" />
            <path d="M36 20L20 36" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path d="M20 20L36 36" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56" fill="none">
            <circle cx="28" cy="28" r="28" fill="#4361ee" />
            <path d="M28 18V38" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path d="M18 28H38" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Expanded panel */}
      {isExpanded && (
        <div className="gemini-generator-overlay" onClick={handleOverlayClick}>
          <div className="gemini-generator-panel">
            {/* Header */}
            <div className="gemini-generator-header">
              <div className="gemini-generator-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M10 20L14 4M4 16L8 12L4 8M20 8L16 12L20 16"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <h2>Backend Code Generator</h2>
              </div>
              <button onClick={() => setIsExpanded(false)} className="gemini-generator-close-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="gemini-generator-content">
              {/* Action Buttons */}
              <div className="gemini-generator-actions">
                <button
                  onClick={handleGenerateCode}
                  disabled={loading}
                  className={`gemini-generator-btn ${loading ? "gemini-generator-btn-disabled" : "gemini-generator-btn-primary"}`}
                >
                  {loading ? (
                    <>
                      <div className="gemini-generator-spinner"></div>
                      Generating Code...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path
                          d="M13.3333 8.33333L10 5M10 5L6.66667 8.33333M10 5V15"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Generate Backend Code
                    </>
                  )}
                </button>

                {generatedFiles.length > 0 && (
                  <button onClick={downloadFiles} className="gemini-generator-btn gemini-generator-btn-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M6.66667 10L10 13.3333M10 13.3333L13.3333 10M10 13.3333V3.33333M3.33333 13.3333V15C3.33333 15.9205 4.07952 16.6667 5 16.6667H15C15.9205 16.6667 16.6667 15.9205 16.6667 15V13.3333"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Download Generated Code
                  </button>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="gemini-generator-error">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 6.66667V10M10 13.3333H10.0083M18.3333 10C18.3333 14.6024 14.6024 18.3333 10 18.3333C5.39763 18.3333 1.66667 14.6024 1.66667 10C1.66667 5.39763 5.39763 1.66667 10 1.66667C14.6024 1.66667 18.3333 5.39763 18.3333 10Z"
                      stroke="#DC2626"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p>{error}</p>
                  <button onClick={() => setError(null)}>✕</button>
                </div>
              )}

              {/* Generated Files Section */}
              {generatedFiles.length > 0 ? (
                <div className="gemini-generator-files">
                  <h3 className="gemini-generator-section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M6.66667 5H16.6667M6.66667 10H16.6667M6.66667 15H16.6667M3.33333 5V5.00667M3.33333 10V10.0067M3.33333 15V15.0067"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Generated Files
                  </h3>

                  <div className="gemini-generator-file-explorer">
                    {/* File Tree */}
                    <div className="gemini-generator-file-tree">
                      <h4>Project Structure</h4>
                      <div className="gemini-generator-folder" style={{ maxHeight: "calc(100% - 30px)", overflowY: "auto" }}>
                        {Object.entries(
                          generatedFiles.reduce((acc, file) => {
                            if (!file || !file.filename) return acc;
                            const parts = file.filename.split("/");
                            const folder = parts.length > 1 ? parts[0] : "root";
                            if (!acc[folder]) acc[folder] = [];
                            acc[folder].push(file);
                            return acc;
                          }, {}),
                        ).map(([folder, files]) => (
                          <div key={folder} className="gemini-generator-folder">
                            <div className="gemini-generator-folder-name">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                  d="M1.33333 3.33333C1.33333 2.59695 1.93028 2 2.66667 2H6L8 4H13.3333C14.0697 4 14.6667 4.59695 14.6667 5.33333V12.6667C14.6667 13.403 14.0697 14 13.3333 14H2.66667C1.93028 14 1.33333 13.403 1.33333 12.6667V3.33333Z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <span>{folder}/</span>
                            </div>
                            <div className="gemini-generator-files-list">
                              {files.map((file, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedFile(file)}
                                  className={`gemini-generator-file-item ${selectedFile === file ? "gemini-generator-file-item-active" : ""}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path
                                      d="M8.66667 1.33333H4C3.26362 1.33333 2.66667 1.93028 2.66667 2.66667V13.3333C2.66667 14.0697 3.26362 14.6667 4 14.6667H12C12.7364 14.6667 13.3333 14.0697 13.3333 13.3333V6M8.66667 1.33333L13.3333 6M8.66667 1.33333V6H13.3333"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span>{file.filename.split("/").pop()}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Code Preview */}
                    <div className="gemini-generator-code-preview">
                      {selectedFile ? (
                        <>
                          <div className="gemini-generator-code-header">
                            <span>{selectedFile.filename}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedFile.content)
                                setCopied(true)
                                setTimeout(() => setCopied(false), 2000)
                              }}
                              className="gemini-generator-copy-btn"
                            >
                              {copied ? (
                                <span className="gemini-generator-copied">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                  >
                                    <path
                                      d="M13.3333 5.33333L6 12.6667L2.66667 9.33333"
                                      stroke="currentColor"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  Copied!
                                </span>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                >
                                  <path
                                    d="M5.33333 5.33333V2.66667C5.33333 1.93029 5.93029 1.33333 6.66667 1.33333H13.3333C14.0697 1.33333 14.6667 1.93029 14.6667 2.66667V9.33333C14.6667 10.0697 14.0697 10.6667 13.3333 10.6667H10.6667M2.66667 14.6667H9.33333C10.0697 14.6667 10.6667 14.0697 10.6667 13.3333V6.66667C10.6667 5.93029 10.0697 5.33333 9.33333 5.33333H2.66667C1.93029 5.33333 1.33333 5.93029 1.33333 6.66667V13.3333C1.33333 14.0697 1.93029 14.6667 2.66667 14.6667Z"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="gemini-generator-code-content">
                            <SyntaxHighlighter
                              language="javascript"
                              style={vscDarkPlus}
                              showLineNumbers={true}
                              wrapLines={true}
                            >
                              {selectedFile.content}
                            </SyntaxHighlighter>
                          </div>
                        </>
                      ) : (
                        <div className="gemini-generator-no-file">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 48 48"
                            fill="none"
                          >
                            <path
                              d="M24 12V24M24 24V36M24 24H36M24 24H12"
                              stroke="#E5E7EB"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p>Select a file to view its contents</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="gemini-generator-empty">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <path
                      d="M32 16V32M32 32V48M32 32H48M32 32H16"
                      stroke="#E5E7EB"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <h3>Generate Backend Code</h3>
                  <p>
                    Click the "Generate Backend Code" button to create a complete Node.js/Express/Mongoose backend based
                    on your UML diagram.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="gemini-generator-footer">
              Powered by Google Gemini AI • All generated code is available for your use
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && <LoadingSkeleton />}

      {/* Error message */}
      {error && !isExpanded && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
    </div>
  )
}

export default GeminiGenerator
