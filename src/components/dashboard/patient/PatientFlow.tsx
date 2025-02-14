
import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import { useCallback } from 'react';
import { ChevronRight } from "lucide-react";

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 0, y: 50 },
    className: 'border-none shadow-none bg-saas-light-purple text-saas-purple font-medium'
  },
  {
    id: '2',
    data: { label: 'Book Appointment' },
    position: { x: 250, y: 50 },
    className: 'border-none shadow-none bg-saas-light-purple text-saas-purple font-medium'
  },
  {
    id: '3',
    data: { label: 'Medical Consultation' },
    position: { x: 500, y: 50 },
    className: 'border-none shadow-none bg-saas-light-purple text-saas-purple font-medium'
  },
  {
    id: '4',
    type: 'output',
    data: { label: 'Treatment Plan' },
    position: { x: 750, y: 50 },
    className: 'border-none shadow-none bg-saas-light-purple text-saas-purple font-medium'
  },
];

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    animated: true,
    style: { stroke: '#8B5CF6' },
    markerEnd: {
      type: 'arrow',
      color: '#8B5CF6',
    }
  },
  { 
    id: 'e2-3', 
    source: '2', 
    target: '3', 
    animated: true,
    style: { stroke: '#8B5CF6' },
    markerEnd: {
      type: 'arrow',
      color: '#8B5CF6',
    }
  },
  { 
    id: 'e3-4', 
    source: '3', 
    target: '4', 
    animated: true,
    style: { stroke: '#8B5CF6' },
    markerEnd: {
      type: 'arrow',
      color: '#8B5CF6',
    }
  },
];

export const PatientFlow = () => {
  const onInit = useCallback(() => {
    console.log('Flow initialized');
  }, []);

  return (
    <div className="h-[150px] bg-white rounded-lg border border-gray-200 mb-6">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        onInit={onInit}
        fitView
        className="bg-white"
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};
