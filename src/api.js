import axios from 'axios';

// Enhanced mock API implementation for testing
// This will generate better diagrams based on the prompt without needing an external API
const mockGenerateDiagram = (prompt) => {
  console.log('Generating diagram from prompt:', prompt);
  
  // More comprehensive parsing for classes and relationships
  const classPatterns = [
    // Direct class declarations
    /\b(?:class|entity|interface|type|enum)\s+([A-Z][a-zA-Z0-9_]*)\b/gi,
    // "Create a/an X class" pattern
    /\bcreate (?:a|an) ([A-Z][a-zA-Z0-9_]*)(?: class| entity| interface| type| enum)?\b/gi,
    // "X class with attributes" pattern
    /\b([A-Z][a-zA-Z0-9_]*) (?:class|entity|interface|type|enum) with\b/gi,
    // Domain-specific entities
    /\b(?:user|customer|product|order|account|transaction|post|comment|article|student|course|admin|manager|employee)\b/gi
  ];
  
  const relationshipPatterns = [
    // X has relationship with Y
    /\b([A-Z][a-zA-Z0-9_]*)\s+(?:has|contains|includes|owns|possesses)\s+(?:a|an|many|multiple|several)?\s*([A-Z][a-zA-Z0-9_]*)/gi,
    // X extends/inherits/implements Y
    /\b([A-Z][a-zA-Z0-9_]*)\s+(?:extends|inherits from|implements|is a|is an|is type of)\s+([A-Z][a-zA-Z0-9_]*)/gi,
    // X is related to Y
    /\b([A-Z][a-zA-Z0-9_]*)\s+(?:is related to|is connected to|is associated with|references|links to|points to)\s+([A-Z][a-zA-Z0-9_]*)/gi,
    // X depends on Y
    /\b([A-Z][a-zA-Z0-9_]*)\s+(?:depends on|uses|requires|needs)\s+([A-Z][a-zA-Z0-9_]*)/gi,
    // Many-to-many, One-to-many patterns
    /\b(?:many|one)\s+([A-Z][a-zA-Z0-9_]*)\s+to\s+(?:many|one)\s+([A-Z][a-zA-Z0-9_]*)/gi
  ];
  
  // Extract class names using all patterns
  let extractedClasses = [];
  classPatterns.forEach(pattern => {
    const matches = [...prompt.matchAll(pattern)];
    const names = matches.map(match => match[1]);
    extractedClasses = [...extractedClasses, ...names];
  });
  
  // Handle domain-specific language
  const domainKeywords = {
    'ecommerce|shop|store|retail': ['User', 'Product', 'Order', 'Cart', 'Payment'],
    'blog|cms|content': ['User', 'Post', 'Comment', 'Category', 'Tag'],
    'banking|finance|payment': ['Account', 'Customer', 'Transaction', 'Card', 'Bank'],
    'social|network|community': ['User', 'Profile', 'Post', 'Friend', 'Message'],
    'education|learning|school': ['Student', 'Course', 'Teacher', 'Grade', 'Assignment'],
    'hospital|medical|health': ['Patient', 'Doctor', 'Appointment', 'MedicalRecord', 'Treatment'],
    'hotel|booking|reservation': ['Guest', 'Room', 'Reservation', 'Service', 'Payment'],
    'library|book': ['Book', 'Member', 'Author', 'Publisher', 'Loan'],
    'inventory|stock': ['Product', 'Warehouse', 'Stock', 'Supplier', 'Order']
  };
  
  // Check if prompt matches any domain
  for (const [domainPattern, classes] of Object.entries(domainKeywords)) {
    const pattern = new RegExp(domainPattern, 'i');
    if (pattern.test(prompt)) {
      extractedClasses = [...extractedClasses, ...classes];
    }
  }
  
  // If still not enough classes found, extract capitalized nouns
  if (extractedClasses.length < 2) {
    const nounRegex = /\b([A-Z][a-zA-Z0-9_]*)\b/g;
    const nouns = [...prompt.matchAll(nounRegex)].map(match => match[1]);
    extractedClasses = [...extractedClasses, ...nouns];
  }
  
  // Remove duplicates and filter out non-class names
  const nonClassWords = ['UML', 'I', 'A', 'Create', 'Design', 'Implement', 'Class', 'Diagram', 'System'];
  extractedClasses = [...new Set(extractedClasses)]
    .filter(name => name && 
            name.length > 1 && 
            !nonClassWords.includes(name) &&
            !/^\d+$/.test(name)); // Filter out numbers
  
  // Extract attributes and methods from prompt
  const attributePattern = /\b([A-Z][a-zA-Z0-9_]*) (?:has|with) (?:attributes?|properties?|fields?)(?:\s+such as|\s+like|\s+including)?\s+([^.]+)/gi;
  const methodPattern = /\b([A-Z][a-zA-Z0-9_]*) (?:has|with) (?:methods?|functions?|operations?)(?:\s+such as|\s+like|\s+including)?\s+([^.]+)/gi;
  
  const attributeMatches = [...prompt.matchAll(attributePattern)];
  const methodMatches = [...prompt.matchAll(methodPattern)];
  
  const classAttributes = {};
  const classMethods = {};
  
  // Parse attributes for classes
  attributeMatches.forEach(match => {
    const className = match[1];
    const attributeText = match[2];
    
    // Extract individual attributes
    const attributes = attributeText.split(/,\s*|\s+and\s+/).map(attr => {
      // Try to extract type information
      const typeMatch = attr.match(/\b([a-zA-Z0-9_]+)(?:\s+as\s+|\s+of type\s+|\s*:\s*)([a-zA-Z0-9_<>]+)/i);
      if (typeMatch) {
        return { name: typeMatch[1].trim(), type: typeMatch[2].trim() };
      }
      return { name: attr.trim(), type: 'string' }; // Default type
    });
    
    if (!classAttributes[className]) {
      classAttributes[className] = [];
    }
    classAttributes[className] = [...classAttributes[className], ...attributes];
  });
  
  // Parse methods for classes
  methodMatches.forEach(match => {
    const className = match[1];
    const methodText = match[2];
    
    // Extract individual methods
    const methods = methodText.split(/,\s*|\s+and\s+/).map(method => {
      // Try to extract return type
      const returnTypeMatch = method.match(/\b([a-zA-Z0-9_]+)(?:\s+returns|\s+returning|\s*->\s*)([a-zA-Z0-9_<>]+)/i);
      if (returnTypeMatch) {
        return { name: returnTypeMatch[1].trim(), returnType: returnTypeMatch[2].trim() };
      }
      return { name: method.trim(), returnType: 'void' }; // Default return type
    });
    
    if (!classMethods[className]) {
      classMethods[className] = [];
    }
    classMethods[className] = [...classMethods[className], ...methods];
  });
  
  // Create nodes
  const nodes = extractedClasses.map((className, index) => {
    // Basic attributes every class should have
    let attributes = [
      { name: 'id', type: 'string' }
    ];
    
    // Add class-specific attributes if found in the prompt
    if (classAttributes[className]) {
      attributes = [...attributes, ...classAttributes[className]];
    } else {
      // Add default attribute based on class name
      attributes.push({ name: className.toLowerCase() + 'Name', type: 'string' });
      
      // Add domain-specific attributes
      if (className.toLowerCase().includes('user') || className.toLowerCase().includes('customer')) {
        attributes.push({ name: 'email', type: 'string' });
        attributes.push({ name: 'password', type: 'string' });
      }
      
      if (className.toLowerCase().includes('product') || className.toLowerCase().includes('item')) {
        attributes.push({ name: 'price', type: 'number' });
        attributes.push({ name: 'description', type: 'string' });
      }
      
      if (className.toLowerCase().includes('order') || className.toLowerCase().includes('transaction')) {
        attributes.push({ name: 'date', type: 'Date' });
        attributes.push({ name: 'amount', type: 'number' });
      }
    }
    
    // Basic methods
    let methods = [];
    
    // Add class-specific methods if found in the prompt
    if (classMethods[className]) {
      methods = [...methods, ...classMethods[className]];
    } else {
      // Add GET method
      methods.push({ name: 'get' + className, returnType: className });
      
      // Add domain-specific methods
      if (prompt.toLowerCase().includes('crud') || 
          prompt.toLowerCase().includes('rest') ||
          prompt.toLowerCase().includes('api')) {
        methods.push({ name: 'create', returnType: className });
        methods.push({ name: 'update', returnType: 'boolean' });
        methods.push({ name: 'delete', returnType: 'boolean' });
      }
    }
    
    // Determine class type based on name and prompt
    let type = 'class'; // Default
    if (prompt.toLowerCase().includes('interface') && className.toLowerCase().includes('interface')) {
      type = 'interface';
    } else if (prompt.toLowerCase().includes('abstract') && className.toLowerCase().includes('abstract')) {
      type = 'abstract';
    } else if (prompt.toLowerCase().includes('enum') && 
              (className.toLowerCase().includes('enum') || 
               className.toLowerCase().includes('type') || 
               className.toLowerCase().includes('status'))) {
      type = 'enum';
    }
    
    return {
      id: `node_${index}`,
      type,
      position: { x: 100 + (index * 300) % 900, y: 100 + Math.floor(index/3) * 250 },
      data: {
        className,
        attributes,
        methods,
      }
    };
  });
  
  // Extract relationships
  let relationships = [];
  
  relationshipPatterns.forEach(pattern => {
    const matches = [...prompt.matchAll(pattern)];
    
    matches.forEach(match => {
      const source = match[1];
      const target = match[2];
      
      if (source && target) {
        relationships.push({
          source,
          target,
          text: match[0]
        });
      }
    });
  });
  
  // Create edges based on relationships
  const edges = [];
  
  relationships.forEach((rel, index) => {
    // Find source and target nodes
    const sourceNode = nodes.find(node => 
      node.data.className.toLowerCase() === rel.source.toLowerCase());
    const targetNode = nodes.find(node => 
      node.data.className.toLowerCase() === rel.target.toLowerCase());
    
    if (sourceNode && targetNode) {
      // Determine relationship type
      let type = 'ASSOCIATION';
      const text = rel.text.toLowerCase();
      
      if (text.includes('extends') || 
          text.includes('inherits') || 
          text.includes('is a') || 
          text.includes('is an')) {
        type = 'INHERITANCE';
      } else if (text.includes('contains') || 
                text.includes('owns') || 
                text.includes('possesses') || 
                text.includes('one to many')) {
        type = 'COMPOSITION';
      } else if (text.includes('has') || 
                text.includes('includes') || 
                text.includes('references')) {
        type = 'AGGREGATION';
      }
      
      edges.push({
        id: `edge_${index}`,
        source: sourceNode.id,
        target: targetNode.id,
        type,
      });
    }
  });
  
  // If no explicit relationships, infer some based on common patterns
  if (edges.length === 0 && nodes.length >= 2) {
    // Look for common patterns
    const userNode = nodes.find(node => 
      node.data.className.toLowerCase().includes('user') || 
      node.data.className.toLowerCase().includes('customer'));
    
    const productNode = nodes.find(node => 
      node.data.className.toLowerCase().includes('product') || 
      node.data.className.toLowerCase().includes('item'));
    
    const orderNode = nodes.find(node => 
      node.data.className.toLowerCase().includes('order') || 
      node.data.className.toLowerCase().includes('cart'));
    
    const categoryNode = nodes.find(node => 
      node.data.className.toLowerCase().includes('category'));
    
    const postNode = nodes.find(node => 
      node.data.className.toLowerCase().includes('post') || 
      node.data.className.toLowerCase().includes('article'));
    
    const commentNode = nodes.find(node => 
      node.data.className.toLowerCase().includes('comment'));
    
    // E-commerce pattern
    if (userNode && orderNode) {
      edges.push({
        id: `edge_inferred_1`,
        source: userNode.id,
        target: orderNode.id,
        type: 'COMPOSITION',
      });
    }
    
    if (orderNode && productNode) {
      edges.push({
        id: `edge_inferred_2`,
        source: orderNode.id,
        target: productNode.id,
        type: 'AGGREGATION',
      });
    }
    
    if (productNode && categoryNode) {
      edges.push({
        id: `edge_inferred_3`,
        source: productNode.id,
        target: categoryNode.id,
        type: 'ASSOCIATION',
      });
    }
    
    // Blog pattern
    if (userNode && postNode) {
      edges.push({
        id: `edge_inferred_4`,
        source: userNode.id,
        target: postNode.id,
        type: 'COMPOSITION',
      });
    }
    
    if (postNode && commentNode) {
      edges.push({
        id: `edge_inferred_5`,
        source: postNode.id,
        target: commentNode.id,
        type: 'COMPOSITION',
      });
    }
    
    if (userNode && commentNode) {
      edges.push({
        id: `edge_inferred_6`,
        source: userNode.id,
        target: commentNode.id,
        type: 'ASSOCIATION',
      });
    }
    
    // If still no edges, connect nodes sequentially
    if (edges.length === 0) {
      const relationshipTypes = ['ASSOCIATION', 'INHERITANCE', 'COMPOSITION', 'AGGREGATION'];
      
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({
          id: `edge_${i}`,
          source: nodes[i].id,
          target: nodes[i + 1].id,
          type: relationshipTypes[i % relationshipTypes.length],
        });
      }
    }
  }
  
  return { nodes, edges };
};

export const generateDiagramFromPrompt = async (prompt) => {
  try {
    // Using enhanced mock implementation
    const result = mockGenerateDiagram(prompt);
    
    // Simulate network delay for a more realistic experience
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(result);
      }, 1500);
    });
  } catch (error) {
    console.error('Error generating diagram:', error);
    throw new Error('Failed to generate diagram from prompt');
  }
};

export const parseAPIResponse = (data) => {
  try {
    // Since our mock API already returns data in the right format,
    // we just need minimal processing
    return {
      nodes: data.nodes.map((node, index) => ({
        id: node.id || `node_${Date.now()}_${index}`,
        type: node.type || 'class',
        position: node.position || { x: index * 250, y: 100 },
        data: {
          className: node.data?.className || 'NewClass',
          attributes: node.data?.attributes || [],
          methods: node.data?.methods || []
        }
      })),
      edges: data.edges.map((edge, index) => ({
        id: edge.id || `edge_${Date.now()}_${index}`,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'ASSOCIATION',
      }))
    };
  } catch (error) {
    console.error('Error parsing API response:', error);
    throw new Error('Invalid response format from LLM API');
  }
}; 