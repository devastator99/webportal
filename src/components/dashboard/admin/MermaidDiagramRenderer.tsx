
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface MermaidDiagramRendererProps {
  diagram: string;
  title: string;
  description?: string;
}

export const MermaidDiagramRenderer: React.FC<MermaidDiagramRendererProps> = ({
  diagram,
  title,
  description
}) => {
  const diagramRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const loadMermaid = async () => {
      try {
        // Dynamic import of mermaid
        const mermaid = await import('mermaid');
        
        mermaid.default.initialize({
          startOnLoad: true,
          theme: 'default',
          securityLevel: 'loose',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            curve: 'basis'
          }
        });

        if (diagramRef.current) {
          diagramRef.current.innerHTML = diagram;
          await mermaid.default.run({
            nodes: [diagramRef.current]
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Mermaid diagram:', error);
        toast.error('Failed to load diagram');
        setIsLoading(false);
      }
    };

    loadMermaid();
  }, [diagram]);

  const handleDownload = () => {
    if (diagramRef.current) {
      const svgElement = diagramRef.current.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '_')}_diagram.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Diagram downloaded successfully');
      }
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 2}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading diagram...</div>
          </div>
        ) : (
          <div className="overflow-auto border rounded-lg bg-white p-4">
            <div
              ref={diagramRef}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
              className="transition-transform duration-200"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
