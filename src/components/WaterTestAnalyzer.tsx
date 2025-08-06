import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, RotateCcw, Save } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TestResult {
  parameter: string;
  value: number;
  unit: string;
  status: 'low' | 'normal' | 'high';
  color: string;
  recommendation?: string;
}

interface ChemicalRecommendation {
  chemical: string;
  amount: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const WaterTestAnalyzer = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [recommendations, setRecommendations] = useState<ChemicalRecommendation[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  // Test strip color ranges (simplified for demo)
  const testStripParameters = [
    {
      name: 'Free Chlorine',
      unit: 'ppm',
      idealRange: [1.0, 3.0],
      colors: [
        { r: 255, g: 255, b: 255, value: 0.0 },
        { r: 255, g: 250, b: 220, value: 0.5 },
        { r: 255, g: 240, b: 180, value: 1.0 },
        { r: 255, g: 220, b: 120, value: 2.0 },
        { r: 255, g: 200, b: 80, value: 3.0 },
        { r: 255, g: 180, b: 40, value: 5.0 },
        { r: 255, g: 160, b: 0, value: 10.0 }
      ]
    },
    {
      name: 'pH',
      unit: '',
      idealRange: [7.2, 7.6],
      colors: [
        { r: 255, g: 100, b: 100, value: 6.2 },
        { r: 255, g: 150, b: 100, value: 6.8 },
        { r: 255, g: 200, b: 150, value: 7.2 },
        { r: 200, g: 255, b: 200, value: 7.6 },
        { r: 150, g: 200, b: 255, value: 8.0 },
        { r: 100, g: 150, b: 255, value: 8.4 }
      ]
    },
    {
      name: 'Total Alkalinity',
      unit: 'ppm',
      idealRange: [80, 120],
      colors: [
        { r: 255, g: 255, b: 200, value: 40 },
        { r: 200, g: 255, b: 200, value: 80 },
        { r: 150, g: 255, b: 150, value: 120 },
        { r: 100, g: 200, b: 255, value: 180 },
        { r: 50, g: 150, b: 255, value: 240 }
      ]
    },
    {
      name: 'Cyanuric Acid',
      unit: 'ppm',
      idealRange: [30, 50],
      colors: [
        { r: 255, g: 255, b: 255, value: 0 },
        { r: 240, g: 240, b: 255, value: 15 },
        { r: 220, g: 220, b: 255, value: 30 },
        { r: 200, g: 200, b: 255, value: 50 },
        { r: 180, g: 180, b: 255, value: 100 },
        { r: 160, g: 160, b: 255, value: 150 }
      ]
    }
  ];

  const startCamera = async () => {
    try {
      console.log('=== Starting Camera ===');
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera not supported');
      }

      const constraints = { video: true };
      console.log('Requesting camera access...');
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✓ Camera stream obtained');
      console.log('Stream details:', {
        id: mediaStream.id,
        active: mediaStream.active,
        videoTracks: mediaStream.getVideoTracks().length
      });
      
      setStream(mediaStream);
      
      // Wait for next frame to ensure video element is rendered
      await new Promise(resolve => requestAnimationFrame(resolve));
      
      if (videoRef.current) {
        console.log('✓ Video element found');
        videoRef.current.srcObject = mediaStream;
        
        // Try to play the video
        try {
          await videoRef.current.play();
          console.log('✓ Video playing');
        } catch (playError) {
          console.warn('Play failed, will retry:', playError);
        }
      } else {
        console.error('✗ Video element not found');
      }
      
      setIsAnalyzing(true);
      console.log('=== Camera setup complete ===');
      
    } catch (error) {
      console.error('=== Camera Error ===', error);
      
      let message = 'Cannot access camera';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          message = 'Camera permission denied';
        } else if (error.name === 'NotFoundError') {
          message = 'No camera found';
        }
      }
      
      toast({
        title: "Camera Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsAnalyzing(false);
    setTestResults([]);
    setRecommendations([]);
  };

  const captureAndAnalyze = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    const video = videoRef.current;
    
    // Check if video is ready and has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video not ready yet, skipping analysis');
      return;
    }

    setIsCapturing(true);
    console.log('Starting capture and analysis...');
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Cannot get canvas context');
      setIsCapturing(false);
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      console.log('Image captured to canvas:', canvas.width, 'x', canvas.height);

      // Analyze the image for test strip colors
      analyzeTestStrip(ctx, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error during capture and analysis:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const analyzeTestStrip = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    console.log('Analyzing test strip with canvas dimensions:', width, 'x', height);
    
    if (width <= 0 || height <= 0) {
      console.error('Invalid canvas dimensions');
      return;
    }

    const results: TestResult[] = [];
    
    // Define regions where test pads typically appear (more conservative sizing)
    const padWidth = Math.floor(width * 0.1);
    const padHeight = Math.floor(height * 0.15);
    const centerY = Math.floor(height * 0.5 - padHeight / 2);
    
    const testPadRegions = [
      { x: Math.floor(width * 0.2), y: centerY, width: padWidth, height: padHeight }, // Free Chlorine
      { x: Math.floor(width * 0.4), y: centerY, width: padWidth, height: padHeight }, // pH
      { x: Math.floor(width * 0.6), y: centerY, width: padWidth, height: padHeight }, // Total Alkalinity
      { x: Math.floor(width * 0.8 - padWidth), y: centerY, width: padWidth, height: padHeight }, // Cyanuric Acid
    ];

    testPadRegions.forEach((region, index) => {
      if (index >= testStripParameters.length) return;

      // Validate region bounds
      if (region.x < 0 || region.y < 0 || 
          region.x + region.width > width || 
          region.y + region.height > height ||
          region.width <= 0 || region.height <= 0) {
        console.warn(`Skipping region ${index} - out of bounds:`, region);
        return;
      }

      try {
        console.log(`Analyzing region ${index}:`, region);
        const imageData = ctx.getImageData(region.x, region.y, region.width, region.height);
        const avgColor = getAverageColor(imageData);
        const parameter = testStripParameters[index];
        const value = matchColorToValue(avgColor, parameter);
        const status = getParameterStatus(value, parameter.idealRange);

        results.push({
          parameter: parameter.name,
          value,
          unit: parameter.unit,
          status,
          color: `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`
        });
      } catch (error) {
        console.error(`Error analyzing region ${index}:`, error);
      }
    });

    console.log('Analysis results:', results);
    setTestResults(results);
    if (results.length > 0) {
      generateRecommendations(results);
    }
  };

  const getAverageColor = (imageData: ImageData) => {
    const data = imageData.data;
    let r = 0, g = 0, b = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }

    return {
      r: Math.round(r / count),
      g: Math.round(g / count),
      b: Math.round(b / count)
    };
  };

  const matchColorToValue = (color: {r: number, g: number, b: number}, parameter: any) => {
    let bestMatch = parameter.colors[0];
    let minDistance = Infinity;

    parameter.colors.forEach((refColor: any) => {
      const distance = Math.sqrt(
        Math.pow(color.r - refColor.r, 2) +
        Math.pow(color.g - refColor.g, 2) +
        Math.pow(color.b - refColor.b, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        bestMatch = refColor;
      }
    });

    return bestMatch.value;
  };

  const getParameterStatus = (value: number, idealRange: number[]): 'low' | 'normal' | 'high' => {
    if (value < idealRange[0]) return 'low';
    if (value > idealRange[1]) return 'high';
    return 'normal';
  };

  const generateRecommendations = (results: TestResult[]) => {
    const recs: ChemicalRecommendation[] = [];

    results.forEach(result => {
      switch (result.parameter) {
        case 'Free Chlorine':
          if (result.status === 'low') {
            recs.push({
              chemical: 'Liquid Chlorine or Chlorine Tablets',
              amount: `${Math.round((3.0 - result.value) * 10)} oz per 10,000 gallons`,
              reason: `Free chlorine is ${result.value} ${result.unit}, below ideal range of 1.0-3.0 ppm`,
              priority: 'high'
            });
          } else if (result.status === 'high') {
            recs.push({
              chemical: 'Stop adding chlorine, let UV break down excess',
              amount: 'Wait 24-48 hours and retest',
              reason: `Free chlorine is ${result.value} ${result.unit}, above ideal range`,
              priority: 'medium'
            });
          }
          break;

        case 'pH':
          if (result.status === 'low') {
            recs.push({
              chemical: 'pH Increaser (Sodium Carbonate)',
              amount: `${Math.round((7.4 - result.value) * 6)} oz per 10,000 gallons`,
              reason: `pH is ${result.value}, below ideal range of 7.2-7.6`,
              priority: 'high'
            });
          } else if (result.status === 'high') {
            recs.push({
              chemical: 'pH Decreaser (Muriatic Acid)',
              amount: `${Math.round((result.value - 7.4) * 12)} oz per 10,000 gallons`,
              reason: `pH is ${result.value}, above ideal range`,
              priority: 'high'
            });
          }
          break;

        case 'Total Alkalinity':
          if (result.status === 'low') {
            recs.push({
              chemical: 'Alkalinity Increaser (Sodium Bicarbonate)',
              amount: `${Math.round((100 - result.value) * 1.5)} oz per 10,000 gallons`,
              reason: `Total alkalinity is ${result.value} ${result.unit}, below ideal range`,
              priority: 'medium'
            });
          } else if (result.status === 'high') {
            recs.push({
              chemical: 'Muriatic Acid (small amounts)',
              amount: `${Math.round((result.value - 100) * 0.8)} oz per 10,000 gallons`,
              reason: `Total alkalinity is ${result.value} ${result.unit}, above ideal range`,
              priority: 'medium'
            });
          }
          break;

        case 'Cyanuric Acid':
          if (result.status === 'low') {
            recs.push({
              chemical: 'Cyanuric Acid (Stabilizer)',
              amount: `${Math.round((40 - result.value) * 1.3)} oz per 10,000 gallons`,
              reason: `Cyanuric acid is ${result.value} ${result.unit}, below ideal range`,
              priority: 'low'
            });
          } else if (result.status === 'high') {
            recs.push({
              chemical: 'Partial water replacement required',
              amount: 'Replace 25-50% of pool water',
              reason: `Cyanuric acid is ${result.value} ${result.unit}, above ideal range`,
              priority: 'medium'
            });
          }
          break;
      }
    });

    setRecommendations(recs);
  };

  const saveResults = () => {
    const timestamp = new Date().toLocaleString();
    const resultsData = {
      timestamp,
      results: testResults,
      recommendations
    };
    
    // Here you could save to local storage or send to a database
    localStorage.setItem(`pool_test_${Date.now()}`, JSON.stringify(resultsData));
    
    toast({
      title: "Results Saved",
      description: "Test results and recommendations have been saved.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'normal': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-secondary text-secondary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Auto-analyze every 3 seconds when camera is active and video is ready
  useEffect(() => {
    if (!isAnalyzing) return;

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        captureAndAnalyze();
      }
    }, 3000); // Increased to 3 seconds to give more time

    return () => clearInterval(interval);
  }, [isAnalyzing, captureAndAnalyze]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Pool Water Test Strip Analyzer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Camera Controls */}
        <div className="flex gap-4 justify-center">
          {!isAnalyzing ? (
            <Button onClick={startCamera} className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Start Camera Analysis
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={captureAndAnalyze} variant="secondary" disabled={isCapturing}>
                <RotateCcw className="h-4 w-4" />
                {isCapturing ? 'Analyzing...' : 'Analyze Now'}
              </Button>
              <Button onClick={stopCamera} variant="outline">
                <CameraOff className="h-4 w-4" />
                Stop Camera
              </Button>
              {testResults.length > 0 && (
                <Button onClick={saveResults} variant="outline">
                  <Save className="h-4 w-4" />
                  Save Results
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Camera Feed */}
        {isAnalyzing && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Camera Status: {stream ? 'Connected' : 'Not Connected'}
              </p>
              {stream && (
                <p className="text-sm text-muted-foreground">
                  Video Tracks: {stream.getVideoTracks().length}
                </p>
              )}
            </div>
            
            <div className="relative bg-black rounded-lg overflow-hidden mx-auto max-w-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-auto block"
                style={{ 
                  maxHeight: '400px',
                  backgroundColor: '#000000'
                }}
                onLoadedMetadata={(e) => {
                  const video = e.currentTarget;
                  console.log('Video loaded - dimensions:', video.videoWidth, 'x', video.videoHeight);
                  console.log('Video element dimensions:', video.clientWidth, 'x', video.clientHeight);
                }}
                onCanPlay={() => {
                  console.log('Video can play');
                }}
                onPlaying={() => {
                  console.log('Video is now playing');
                }}
                onError={(e) => {
                  console.error('Video error:', e);
                }}
                onLoadStart={() => console.log('Video load started')}
                onLoadedData={() => console.log('Video data loaded')}
              />
              
              {/* Debug overlay */}
              <div className="absolute top-2 left-2 bg-black/75 text-white p-2 rounded text-xs">
                <div>Stream: {stream ? '✓' : '✗'}</div>
                <div>Video: {videoRef.current ? '✓' : '✗'}</div>
                <div>Tracks: {stream?.getVideoTracks().length || 0}</div>
              </div>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Test strip guide overlay */}
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Position test strip in camera view</p>
              <div className="flex justify-center gap-2">
                <div className="w-6 h-6 border-2 border-primary rounded bg-primary/20"></div>
                <div className="w-6 h-6 border-2 border-primary rounded bg-primary/20"></div>
                <div className="w-6 h-6 border-2 border-primary rounded bg-primary/20"></div>
                <div className="w-6 h-6 border-2 border-primary rounded bg-primary/20"></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Chlorine - pH - Alkalinity - Cyanuric Acid
              </p>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Test Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testResults.map((result, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{result.parameter}</h4>
                    <Badge className={getStatusColor(result.status)}>
                      {result.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded border"
                      style={{ backgroundColor: result.color }}
                    />
                    <span className="font-mono text-lg">
                      {result.value} {result.unit}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Chemical Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Chemical Recommendations</h3>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{rec.chemical}</h4>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority} priority
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                  <p className="font-medium text-primary">{rec.amount}</p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Card className="p-4 bg-muted/50">
          <h4 className="font-medium mb-2">Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Dip test strip in pool water for 2 seconds</li>
            <li>• Remove and shake off excess water</li>
            <li>• Wait 15 seconds for colors to develop</li>
            <li>• Position strip in the camera viewfinder</li>
            <li>• Analysis will occur automatically every 2 seconds</li>
          </ul>
        </Card>
      </CardContent>
    </Card>
  );
};

export default WaterTestAnalyzer;