"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface VideoUploadProps {
  onVideoSelected: (file: File, metadata: any) => void
  onUploadProgress: (progress: number) => void
  onUploadComplete: (result: any) => void
  onUploadError: (error: string) => void
  maxFileSize?: number // in MB
  acceptedFormats?: string[]
}

interface VideoFormData {
  title: string
  description: string
  privacy: 'public' | 'unlisted' | 'private'
  tags: string
}

export function VideoUpload({
  onVideoSelected,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  maxFileSize = 100,
  acceptedFormats = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm']
}: VideoUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    privacy: 'public',
    tags: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!acceptedFormats.includes(file.type)) {
      return `File type ${file.type} is not supported. Accepted formats: ${acceptedFormats.join(', ')}`
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024)
    if (fileSizeInMB > maxFileSize) {
      return `File size (${fileSizeInMB.toFixed(2)}MB) exceeds maximum allowed size of ${maxFileSize}MB`
    }

    return null
  }

  const extractVideoMetadata = (file: File): Promise<any> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const url = URL.createObjectURL(file)
      
      video.onloadedmetadata = () => {
        const metadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          type: file.type,
          name: file.name
        }
        URL.revokeObjectURL(url)
        resolve(metadata)
      }
      
      video.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({
          size: file.size,
          type: file.type,
          name: file.name
        })
      }
      
      video.src = url
    })
  }

  const handleFileSelect = useCallback(async (files: FileList) => {
    const file = files[0]
    if (!file) return

    const error = validateFile(file)
    if (error) {
      onUploadError(error)
      return
    }

    setSelectedFile(file)
    
    // Auto-populate title if empty
    if (!formData.title) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "")
      setFormData(prev => ({
        ...prev,
        title: fileNameWithoutExt
      }))
    }
    
    // Extract metadata
    const metadata = await extractVideoMetadata(file)
    onVideoSelected(file, { ...metadata, formData })
  }, [maxFileSize, acceptedFormats, onVideoSelected, onUploadError, formData])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      onUploadError('Please select a video file first')
      return
    }

    if (!formData.title.trim()) {
      onUploadError('Please enter a title for your video')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    onUploadProgress(0)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('video', selectedFile)
      uploadFormData.append('title', formData.title)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('privacy', formData.privacy)
      uploadFormData.append('tags', formData.tags)

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 10, 90)
          onUploadProgress(newProgress)
          return newProgress
        })
      }, 500)

      const response = await fetch('/api/youtube/upload', {
        method: 'POST',
        body: uploadFormData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      onUploadProgress(100)

      if (response.ok) {
        const result = await response.json()
        onUploadComplete(result)
        
        // Reset form
        setSelectedFile(null)
        setFormData({
          title: '',
          description: '',
          privacy: 'public',
          tags: ''
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        const error = await response.json()
        onUploadError(error.error || 'Upload failed')
      }
    } catch (error: any) {
      onUploadError(error.message || 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>YouTube Video Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleChange}
          className="hidden"
        />
        
        {/* File Selection */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
              : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <div>
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              
              <div className="flex justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerFileSelect}
                >
                  Change Video
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium">
                  Drag and drop your video here, or{' '}
                  <button
                    onClick={triggerFileSelect}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    browse files
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join(', ')}
                </p>
                <p className="text-xs text-gray-500">
                  Maximum file size: {maxFileSize}MB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Video Details Form */}
        {selectedFile && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
                maxLength={100}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.title.length}/100 characters</p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter video description"
                maxLength={5000}
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/5000 characters</p>
            </div>

            <div>
              <Label htmlFor="privacy">Privacy</Label>
              <select
                id="privacy"
                value={formData.privacy}
                onChange={(e) => setFormData(prev => ({ ...prev, privacy: e.target.value as 'public' | 'unlisted' | 'private' }))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Enter tags separated by commas (e.g., gaming, tutorial, fun)"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
            </div>

            <Button 
              onClick={handleUpload}
              disabled={isUploading || !formData.title.trim()}
              className="w-full"
            >
              {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload to YouTube'}
            </Button>
          </div>
        )}
        
        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading to YouTube...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}