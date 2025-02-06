import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import { useCallback } from 'react';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 250, y: 0 },
    className: 'bg-white border border-gray-200'
  },
  {
    id: '2',
    data: { label: 'Book Appointment' },
    position: { x: 250, y: 100 },
    className: 'bg-white border border-gray-200'
  },
  {
    id: '3',
    data: { label: 'Medical Consultation' },
    position: { x: 250, y: 200 },
    className: 'bg-white border border-gray-200'
  },
  {
    id: '4',
    type: 'output',
    data: { label: 'Treatment Plan' },
    position: { x: 250, y: 300 },
    className: 'bg-white border border-gray-200'
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },
  { id: 'e3-4', source: '3', target: '4', animated: true },
];

export const PatientFlow = () => {
  const onInit = useCallback(() => {
    console.log('Flow initialized');
  }, []);

  return (
    <div className="h-[300px] bg-white rounded-lg border border-gray-200">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        onInit={onInit}
        fitView
        className="bg-gray-50"
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};