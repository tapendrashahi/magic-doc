# Quick Start Implementation Guide

## 🚀 Getting Started - First Steps

### Prerequisites Check
```bash
# Check Python version (need 3.8+)
python --version

# Check Node version (need 14+)
node --version

# Check npm
npm --version
```

---

## 📝 Phase 1: Quick Setup (Day 1-2)

### Step 1.1: Create API Specification

Create `backend/compiler/__init__.py`:
```python
# Empty init file
```

Create `backend/compiler/urls.py`:
```python
from django.urls import path
from .views import (
    convert_tex,
    convert_batch_tex,
    export_file,
    download_export,
    get_stats
)

urlpatterns = [
    path('convert-tex/', convert_tex, name='convert_tex'),
    path('convert-batch/', convert_batch_tex, name='convert_batch'),
    path('export/', export_file, name='export'),
    path('download/<str:file_id>/', download_export, name='download'),
    path('stats/<str:conversion_id>/', get_stats, name='get_stats'),
]
```

### Step 1.2: Create Backend Views (Skeleton)

Create `backend/compiler/views.py`:
```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_tex(request):
    """Convert single .tex file to TipTap HTML"""
    try:
        tex_content = request.data.get('tex_content')
        filename = request.data.get('filename', 'document.tex')
        
        if not tex_content:
            return Response(
                {'error': 'tex_content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Call converter pipeline
        # from backend.converter.converter import convert_mathpix_to_lms_html
        # html = convert_mathpix_to_lms_html(tex_content)
        
        return Response({
            'success': True,
            'data': {
                'id': 'conv_temp',
                'filename': filename,
                'html': '<h1>Placeholder</h1>',
                'stats': {
                    'equations_found': 0,
                    'equations_rendered': 0,
                    'processing_time_ms': 0
                }
            }
        })
    except Exception as e:
        logger.error(f'Conversion failed: {str(e)}')
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_batch_tex(request):
    """Convert multiple .tex files"""
    return Response({'message': 'TODO: Implement batch conversion'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_file(request):
    """Export HTML to different formats"""
    return Response({'message': 'TODO: Implement export'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_export(request, file_id):
    """Download exported file"""
    return Response({'message': 'TODO: Implement download'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stats(request, conversion_id):
    """Get compilation statistics"""
    return Response({'message': 'TODO: Implement stats'})
```

### Step 1.3: Add URL to Main Router

Update `backend/config/urls.py`:
```python
from django.urls import path, include

urlpatterns = [
    # ... existing patterns ...
    path('api/compiler/', include('compiler.urls')),
]
```

### Step 1.4: Create Frontend Route

Create `frontend/src/pages/Compiler.tsx`:
```typescript
import React, { useState } from 'react';
import { CompilerLayout } from '../components/CompilerLayout';

export const Compiler: React.FC = () => {
  const [files, setFiles] = useState([]);

  return (
    <div className="compiler-page">
      <CompilerLayout files={files} />
    </div>
  );
};
```

Add to router in `frontend/src/App.tsx`:
```typescript
import { Compiler } from './pages/Compiler';

// In your router:
<Route path="/compiler" element={<Compiler />} />
```

---

## 🔧 Phase 2: Integration with Existing Converter (Day 3-4)

### Step 2.1: Test Existing Converter

Create test file `backend/compiler/test_converter.py`:
```python
import os
from backend.converter.converter import convert_mathpix_to_lms_html

# Load sample .tex file
tex_file = '/home/tapendra/Documents/latex-converter-web/roadmap/82f1d41c-1d57-41c6-91fc-4a86d4328095.tex'

with open(tex_file, 'r', encoding='utf-8') as f:
    tex_content = f.read()

# Test conversion
try:
    html = convert_mathpix_to_lms_html(tex_content)
    print("✓ Conversion successful")
    print(f"HTML length: {len(html)}")
    print(f"Contains tiptap-katex: {'tiptap-katex' in html}")
except Exception as e:
    print(f"✗ Conversion failed: {e}")
```

Run test:
```bash
cd /home/tapendra/Documents/latex-converter-web
python backend/compiler/test_converter.py
```

### Step 2.2: Integrate Converter into View

Update `backend/compiler/views.py`:
```python
from backend.converter.converter import convert_mathpix_to_lms_html_with_stats
import time

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def convert_tex(request):
    """Convert single .tex file to TipTap HTML"""
    try:
        tex_content = request.data.get('tex_content')
        filename = request.data.get('filename', 'document.tex')
        
        if not tex_content:
            return Response(
                {'error': 'tex_content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (10MB limit)
        if len(tex_content) > 10 * 1024 * 1024:
            return Response(
                {'error': 'File size exceeds 10MB limit'},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )
        
        # Convert using existing pipeline
        start_time = time.time()
        html, stats = convert_mathpix_to_lms_html_with_stats(tex_content)
        processing_time = int((time.time() - start_time) * 1000)
        
        # Generate unique ID for this conversion
        conversion_id = f"conv_{uuid.uuid4().hex[:12]}"
        
        return Response({
            'success': True,
            'data': {
                'id': conversion_id,
                'filename': filename,
                'html': html,
                'stats': {
                    **stats,
                    'processing_time_ms': processing_time
                }
            }
        })
    except Exception as e:
        logger.error(f'Conversion failed: {str(e)}', exc_info=True)
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## 💻 Phase 3: Frontend Components (Day 5-6)

### Step 3.1: Create Layout Component

Create `frontend/src/components/CompilerLayout.tsx`:
```typescript
import React from 'react';
import { CompilerSidebar } from './CompilerSidebar';
import { CompilerCodePanel } from './CompilerCodePanel';
import { CompilerPreviewPanel } from './CompilerPreviewPanel';
import { CompilerMenuBar } from './CompilerMenuBar';
import '../styles/compiler.css';

export const CompilerLayout: React.FC<any> = ({ files }) => {
  const [activeFileId, setActiveFileId] = React.useState(null);

  return (
    <div className="compiler-container">
      <CompilerMenuBar />
      
      <div className="compiler-layout">
        <CompilerSidebar 
          files={files}
          activeFileId={activeFileId}
          onFileSelect={setActiveFileId}
        />
        
        <CompilerCodePanel 
          file={files.find(f => f.id === activeFileId) || null}
        />
        
        <CompilerPreviewPanel 
          html=""
          isLoading={false}
        />
      </div>
    </div>
  );
};
```

### Step 3.2: Create Sidebar Component

Create `frontend/src/components/CompilerSidebar.tsx`:
```typescript
import React, { useRef } from 'react';

export const CompilerSidebar: React.FC<any> = ({ files, activeFileId, onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles) {
      console.log('Files uploaded:', uploadedFiles);
      // TODO: Process files
    }
  };

  return (
    <aside className="compiler-sidebar">
      <h3>📁 Files</h3>
      
      <ul className="file-list">
        {files.map((file: any) => (
          <li 
            key={file.id}
            className={`file-item ${activeFileId === file.id ? 'active' : ''}`}
            onClick={() => onFileSelect(file.id)}
          >
            <span>{file.name}</span>
          </li>
        ))}
      </ul>

      <div className="upload-zone">
        <input
          ref={fileInputRef}
          type="file"
          accept=".tex"
          multiple
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current?.click()}>
          ➕ Upload Files
        </button>
      </div>
    </aside>
  );
};
```

### Step 3.3: Create Code Panel

Create `frontend/src/components/CompilerCodePanel.tsx`:
```typescript
import React from 'react';

export const CompilerCodePanel: React.FC<any> = ({ file }) => {
  return (
    <div className="code-panel">
      <div className="code-header">
        <span className="filename">{file?.name || 'No file selected'}</span>
      </div>
      
      <textarea
        className="code-editor"
        value={file?.content || ''}
        readOnly
        placeholder="Upload a .tex file to start"
      />
    </div>
  );
};
```

### Step 3.4: Create Preview Panel

Create `frontend/src/components/CompilerPreviewPanel.tsx`:
```typescript
import React from 'react';

export const CompilerPreviewPanel: React.FC<any> = ({ html, isLoading }) => {
  return (
    <div className="preview-panel">
      <div className="preview-header">
        <span>Preview</span>
      </div>
      
      {isLoading && <div>Loading...</div>}
      
      {html && (
        <div 
          className="preview-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
      
      {!html && !isLoading && (
        <div className="preview-empty">Compile a file to see preview</div>
      )}
    </div>
  );
};
```

### Step 3.5: Create Menu Bar

Create `frontend/src/components/CompilerMenuBar.tsx`:
```typescript
import React from 'react';

export const CompilerMenuBar: React.FC = () => {
  const handleCompile = () => {
    console.log('TODO: Implement compile');
  };

  return (
    <div className="menu-bar">
      <button className="btn btn-primary" onClick={handleCompile}>
        ▶ Compile
      </button>
      <button className="btn">📋 Copy</button>
      <button className="btn">📥 Export</button>
      <button className="btn">⋯ More</button>
    </div>
  );
};
```

### Step 3.6: Add Basic Styling

Create `frontend/src/styles/compiler.css`:
```css
.compiler-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.menu-bar {
  background: #f5f5f5;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn {
  padding: 8px 12px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}

.btn-primary {
  background: #0066cc;
  color: white;
  border-color: #0052a3;
}

.compiler-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.compiler-sidebar {
  width: 240px;
  border-right: 1px solid #ddd;
  padding: 12px;
  overflow-y: auto;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0 0 12px 0;
}

.file-item {
  padding: 8px;
  cursor: pointer;
  border-radius: 4px;
}

.file-item.active {
  background: #e6f2ff;
}

.code-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #ddd;
}

.code-header {
  padding: 8px 12px;
  border-bottom: 1px solid #ddd;
  background: #f9f9f9;
  font-weight: 500;
}

.code-editor {
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 12px;
  border: none;
  resize: none;
}

.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 8px 12px;
  border-bottom: 1px solid #ddd;
  background: #f9f9f9;
  font-weight: 500;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-family: 'Georgia', serif;
  line-height: 1.6;
}

.preview-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
```

---

## 🔌 Phase 4: Connect Frontend to Backend (Day 7)

### Step 4.1: Create API Service

Create `frontend/src/services/compilerService.ts`:
```typescript
import axios from 'axios';

const API_BASE = '/api/compiler';

export const compilerService = {
  async convertTex(texContent: string, filename: string) {
    const response = await axios.post(`${API_BASE}/convert-tex/`, {
      tex_content: texContent,
      filename: filename
    });
    return response.data;
  },

  async exportFile(html: string, format: string, filename: string) {
    const response = await axios.post(`${API_BASE}/export/`, {
      html_content: html,
      format: format,
      filename: filename
    });
    return response.data;
  }
};
```

### Step 4.2: Update Compiler Page

Update `frontend/src/pages/Compiler.tsx`:
```typescript
import React, { useState } from 'react';
import { CompilerLayout } from '../components/CompilerLayout';
import { compilerService } from '../services/compilerService';

export const Compiler: React.FC = () => {
  const [files, setFiles] = useState<any[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [compiledHtml, setCompiledHtml] = useState('');
  const [isCompiling, setIsCompiling] = useState(false);

  const handleFileUpload = (uploadedFiles: File[]) => {
    const newFiles = Array.from(uploadedFiles).map(file => ({
      id: Math.random().toString(),
      name: file.name,
      content: '', // Will be read below
      status: 'pending'
    }));

    // Read file contents
    newFiles.forEach((f, idx) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFiles(prev => {
          const updated = [...prev];
          updated[prev.length - newFiles.length + idx].content = content;
          return updated;
        });
      };
      reader.readAsText(uploadedFiles[idx]);
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleCompile = async () => {
    const activeFile = files.find(f => f.id === activeFileId);
    if (!activeFile) return;

    setIsCompiling(true);
    try {
      const result = await compilerService.convertTex(
        activeFile.content,
        activeFile.name
      );
      setCompiledHtml(result.data.html);
    } catch (error) {
      console.error('Compilation failed:', error);
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="compiler-page">
      <CompilerLayout 
        files={files}
        activeFileId={activeFileId}
        compiledHtml={compiledHtml}
        isCompiling={isCompiling}
        onFileSelect={setActiveFileId}
        onFileUpload={handleFileUpload}
        onCompile={handleCompile}
      />
    </div>
  );
};
```

---

## ✅ Testing Checklist

### Backend Testing
```bash
# Test conversion endpoint
curl -X POST http://localhost:8000/api/compiler/convert-tex/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tex_content": "\\section{Test}\\nRegular text with $E=mc^2$.",
    "filename": "test.tex"
  }'
```

### Frontend Testing
```bash
# Start frontend dev server
cd frontend
npm start

# Visit http://localhost:3000/compiler
```

---

## 📊 Implementation Progress Tracker

- [ ] Phase 1: Setup & Skeleton (Days 1-2)
  - [ ] Create API endpoints
  - [ ] Create React components (skeleton)
  - [ ] Add routing

- [ ] Phase 2: Integrate Converter (Days 3-4)
  - [ ] Test existing converter
  - [ ] Connect to API endpoint
  - [ ] Test API with sample files

- [ ] Phase 3: Frontend Components (Days 5-6)
  - [ ] Complete all components
  - [ ] Add file upload
  - [ ] Add basic styling

- [ ] Phase 4: Connect F2B (Day 7)
  - [ ] Create API service
  - [ ] Update compile button
  - [ ] Test end-to-end

- [ ] Phase 5: Export & Polish (Days 8-9)
  - [ ] Implement export handlers
  - [ ] Add export dialog
  - [ ] Polish UI/UX

- [ ] Phase 6: Testing & Deployment (Days 10-11)
  - [ ] Write tests
  - [ ] Performance optimization
  - [ ] Deploy to production

---

## 🎯 Quick Commands Reference

```bash
# Backend
cd backend
python manage.py migrate
python manage.py runserver

# Frontend
cd frontend
npm install
npm start

# Test conversion
python backend/compiler/test_converter.py

# Run tests
python manage.py test
npm test
```

---

**Next**: Start with Phase 1 setup and test with actual .tex files!
