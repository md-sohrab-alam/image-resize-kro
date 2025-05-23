import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import imageCompression from 'browser-image-compression';

interface ImageDimensions {
  width: number;
  height: number;
}

function App() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processedImageUrl, setProcessedImageUrl] = useState<string>('');
  const [originalDimensions, setOriginalDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [dimensions, setDimensions] = useState<ImageDimensions>({ width: 0, height: 0 });
  const [targetSizeKB, setTargetSizeKB] = useState<string>('');
  const [maintainAspectRatio, setMaintainAspectRatio] = useState<boolean>(true);
  const [dimensionsChanged, setDimensionsChanged] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Reset states
      setProcessedImageUrl('');
      setTargetSizeKB('');
      setDimensionsChanged(false);

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        const newDimensions = {
          width: img.width,
          height: img.height
        };
        setOriginalDimensions(newDimensions);
        setDimensions(newDimensions);
      };
      img.src = url;
    }
  };

  const handleDimensionChange = (type: 'width' | 'height', value: number) => {
    if (maintainAspectRatio && originalDimensions.width && originalDimensions.height) {
      const aspectRatio = originalDimensions.width / originalDimensions.height;
      
      if (type === 'width') {
        setDimensions({
          width: value,
          height: Math.round(value / aspectRatio)
        });
      } else {
        setDimensions({
          width: Math.round(value * aspectRatio),
          height: value
        });
      }
    } else {
      setDimensions(prev => ({
        ...prev,
        [type]: value
      }));
    }
    setDimensionsChanged(true);
  };

  const handleResize = async () => {
    if (!selectedImage) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      ctx?.drawImage(img, 0, 0, dimensions.width, dimensions.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setProcessedImageUrl(url);
        }
      }, 'image/jpeg', 0.9);
    };

    img.src = previewUrl;
  };

  const handleCompress = async () => {
    if (!selectedImage || !targetSizeKB) return;

    const targetSizeMB = Number(targetSizeKB) / 1024;
    
    const options = {
      maxSizeMB: targetSizeMB,
      maxWidthOrHeight: Math.max(originalDimensions.width, originalDimensions.height),
      useWebWorker: true,
      initialQuality: 0.9,
    };

    try {
      const compressedFile = await imageCompression(selectedImage, options);
      const url = URL.createObjectURL(compressedFile);
      setProcessedImageUrl(url);

      // Show the actual size achieved
      const actualSizeKB = Math.round(compressedFile.size / 1024);
      alert(`Compressed image size: ${actualSizeKB}KB`);
    } catch (error) {
      console.error('Error compressing image:', error);
      alert('Error compressing image. Please try a larger target size.');
    }
  };

  const resetResize = () => {
    setDimensions({ ...originalDimensions });
    setDimensionsChanged(false);
  };

  const resetCompress = () => {
    setTargetSizeKB('');
    setProcessedImageUrl('');
  };

  const getAspectRatio = (width: number, height: number) => {
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Image Resize Kro
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stack spacing={3}>
            <Button
              variant="contained"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Image
            </Button>
            <input
              type="file"
              hidden
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
            />

            {previewUrl && (
              <>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Original Image Details:
                  </Typography>
                  <Typography>
                    Size: {selectedImage && Math.round(selectedImage.size / 1024)}KB
                  </Typography>
                  <Typography>
                    Dimensions: {originalDimensions.width} x {originalDimensions.height}
                  </Typography>
                  <Typography>
                    Aspect Ratio: {getAspectRatio(originalDimensions.width, originalDimensions.height)}
                  </Typography>
                </Box>

                <Divider />

                {/* Resize Section */}
                <Box>
                  <Typography variant="h6" gutterBottom>Resize Image</Typography>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={maintainAspectRatio}
                        onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                      />
                    }
                    label="Maintain Aspect Ratio"
                  />
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      type="number"
                      label="Width"
                      value={dimensions.width}
                      onChange={(e) => handleDimensionChange('width', Number(e.target.value))}
                    />
                    <TextField
                      type="number"
                      label="Height"
                      value={dimensions.height}
                      onChange={(e) => handleDimensionChange('height', Number(e.target.value))}
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleResize}
                      disabled={!dimensionsChanged}
                    >
                      Resize Image
                    </Button>
                    <Button variant="outlined" onClick={resetResize}>
                      Reset Size
                    </Button>
                  </Stack>
                </Box>

                <Divider />

                {/* Compress Section */}
                <Box>
                  <Typography variant="h6" gutterBottom>Compress Image</Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TextField
                      type="number"
                      label="Target Size (KB)"
                      value={targetSizeKB}
                      onChange={(e) => setTargetSizeKB(e.target.value)}
                      helperText="Enter desired file size in KB"
                    />
                    <Button 
                      variant="contained" 
                      onClick={handleCompress}
                      disabled={!targetSizeKB}
                    >
                      Compress to Target Size
                    </Button>
                    <Button variant="outlined" onClick={resetCompress}>
                      Reset Compression
                    </Button>
                  </Stack>
                </Box>

                <Divider />

                {/* Image Preview Section */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>Original</Typography>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </Box>
                  
                  {processedImageUrl && (
                    <Box>
                      <Typography variant="h6" gutterBottom>Processed</Typography>
                      <img
                        src={processedImageUrl}
                        alt="Processed"
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                      <Button
                        variant="contained"
                        sx={{ mt: 1 }}
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = processedImageUrl;
                          link.download = 'processed-image.jpg';
                          link.click();
                        }}
                      >
                        Download
                      </Button>
                    </Box>
                  )}
                </Box>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default App; 