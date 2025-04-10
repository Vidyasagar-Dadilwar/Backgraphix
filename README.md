# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# UML Diagram Generator

A modern React application for creating, editing, and managing UML class diagrams with AI assistance.

## Features

### Diagram Creation and Editing
- Drag-and-drop interface for creating class diagrams
- Create different types of nodes: Classes, Interfaces, Abstract Classes, and Enums
- Define relationships: Association, Inheritance, Composition, and Aggregation
- Edit node properties: class name, attributes, and methods
- Real-time diagram updates

### AI-Assisted Diagram Generation
- Generate diagrams from natural language descriptions
- AI processes your requirements and creates a complete diagram structure
- Customize and refine AI-generated diagrams with the visual editor

### File Management
- Save diagrams to local browser storage
- Export diagrams as JSON files
- Import previously saved diagrams
- Manage multiple saved diagrams

### Modern UI
- Intuitive, responsive interface
- JSON editor for direct diagram code manipulation
- Tabs to switch between diagram view and JSON representation
- Visual feedback with loading indicators and error messages

## Getting Started

### Prerequisites
- Node.js (v16.0.0 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/uml-diagram-generator.git
cd uml-diagram-generator
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## How to Use

### Creating a Diagram with AI
1. Enter a description of your system in the prompt input field at the top
2. Click "Generate Diagram" and wait for the AI to process your request
3. The generated diagram will appear in the canvas for you to customize

### Manual Diagram Creation
1. Select a node type from the sidebar
2. Drag it onto the canvas to create a new node
3. Click on a node to select it, then:
   - Use the "Edit" button (pencil icon) to modify its properties
   - Add or remove attributes and methods
   - Change the node type
4. Create relationships by:
   - Selecting a relationship type in the sidebar
   - Clicking on the source node and then the target node

### Working with Files
1. Save your diagram:
   - Click "Save Diagram" to store it in the browser
   - Enter a name for your diagram
2. Export your diagram:
   - Click "Export as JSON" to download the diagram as a JSON file
3. Import a diagram:
   - Click "Import Diagram" and select a previously exported JSON file
4. Access saved diagrams:
   - Switch to the "Saved Diagrams" tab in the sidebar
   - Click on a saved diagram to load it

## Configuration

To use a different LLM API endpoint, modify the `API_ENDPOINT` variable in `src/api.js`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [React](https://reactjs.org/)
- Diagram functionality powered by [React Flow](https://reactflow.dev/)
- Development tooling by [Vite](https://vitejs.dev/)

# Backgraphix-frontend
