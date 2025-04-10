import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';

// Association Edge with arrow marker
export function AssociationEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{ stroke: '#555', strokeWidth: 2 }}
                markerEnd="arrow"
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        background: 'white',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontSize: 12,
                        fontWeight: 500,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    {data?.label || '→ Association'}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

// Inheritance Edge with closed arrow marker
export function InheritanceEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{ stroke: '#2563eb', strokeWidth: 2 }}
                markerEnd="arrowclosed"
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        background: 'white',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontSize: 12,
                        fontWeight: 500,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    {data?.label || '▷ Inheritance'}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

// Composition Edge with diamond marker
export function CompositionEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{ stroke: '#dc2626', strokeWidth: 2 }}
                markerEnd="diamond"
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        background: 'white',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontSize: 12,
                        fontWeight: 500,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    {data?.label || '◆ Composition'}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

// Aggregation Edge with diamond marker
export function AggregationEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data }) {
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge
                id={id}
                path={edgePath}
                style={{ stroke: '#d97706', strokeWidth: 2 }}
                markerEnd="diamond"
            />
            <EdgeLabelRenderer>
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        background: 'white',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontSize: 12,
                        fontWeight: 500,
                        pointerEvents: 'all',
                    }}
                    className="nodrag nopan"
                >
                    {data?.label || '◇ Aggregation'}
                </div>
            </EdgeLabelRenderer>
        </>
    );
} 