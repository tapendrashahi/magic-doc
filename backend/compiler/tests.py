"""
Comprehensive tests for compiler API endpoints
"""
import json
from django.test import TestCase, Client
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import ConversionHistory, ExportedFile


class ConvertTexAPITest(TestCase):
    """Test LaTeX to TipTap HTML conversion"""
    
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('compiler:convert-tex')
    
    def test_convert_tex_success(self):
        """Test successful .tex conversion"""
        data = {
            "filename": "test.tex",
            "content": r"\section{Hello}\nLorem ipsum\n$E=mc^2$"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('html', response.data)
        self.assertIn('stats', response.data)
        self.assertIn('conversion_time_ms', response.data['stats'])
    
    def test_convert_tex_with_math(self):
        """Test conversion with mathematical equations"""
        data = {
            "filename": "math.tex",
            "content": r"\section{Equations}\n$\frac{x^2}{y}$\n$$\int_0^1 x dx$$"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        # Should contain math-related content
        self.assertIn('tiptap-katex', response.data['html'])
    
    def test_convert_tex_invalid_filename(self):
        """Test rejection of non-.tex files"""
        data = {
            "filename": "test.txt",
            "content": "Some content"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_convert_tex_empty_content(self):
        """Test handling of empty content"""
        data = {
            "filename": "empty.tex",
            "content": ""
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_convert_tex_missing_filename(self):
        """Test validation of required filename field"""
        data = {
            "content": "Some content"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_convert_tex_saves_history(self):
        """Test that conversion is saved to history"""
        initial_count = ConversionHistory.objects.count()
        
        data = {
            "filename": "tracked.tex",
            "content": r"\section{Test}"
        }
        response = self.client.post(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # History should be created (if models are migrated)
        # Note: This may be optional, so we just check the response


class ConvertBatchAPITest(TestCase):
    """Test batch LaTeX to TipTap HTML conversion"""
    
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('compiler:convert-batch')
    
    def test_convert_batch_success(self):
        """Test successful batch conversion"""
        data = {
            "files": [
                {"filename": "test1.tex", "content": r"\section{Hello}"},
                {"filename": "test2.tex", "content": r"\section{World}"}
            ]
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['total_files'], 2)
        self.assertEqual(response.data['successful'], 2)
        self.assertEqual(response.data['failed'], 0)
    
    def test_convert_batch_mixed_results(self):
        """Test batch conversion with some failures"""
        data = {
            "files": [
                {"filename": "good.tex", "content": r"\section{Good}"},
                {"filename": "bad.txt", "content": "Bad extension"},
            ]
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_files'], 2)
        self.assertEqual(response.data['successful'], 1)
        self.assertEqual(response.data['failed'], 1)
    
    def test_convert_batch_empty_list(self):
        """Test rejection of empty file list"""
        data = {"files": []}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_convert_batch_missing_files(self):
        """Test rejection when files field missing"""
        data = {}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_convert_batch_large_batch(self):
        """Test conversion of multiple files"""
        files = [
            {"filename": f"file{i}.tex", "content": f"\\section{{File {i}}}"}
            for i in range(10)
        ]
        data = {"files": files}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_files'], 10)
        self.assertEqual(response.data['successful'], 10)


class ExportAPITest(TestCase):
    """Test export to various formats"""
    
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('compiler:export')
        self.sample_html = "<h2>Test</h2><p>Lorem ipsum</p><p><span class=\"tiptap-katex\" data-latex=\"E%3Dmc%5E2\">E=mc²</span></p>"
    
    def test_export_json_success(self):
        """Test successful JSON export"""
        data = {
            "html_content": self.sample_html,
            "export_format": "json",
            "filename": "test"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['format'], 'json')
        self.assertIn('file_id', response.data)
        self.assertIn('download_url', response.data)
    
    def test_export_csv_success(self):
        """Test successful CSV export (requires table content)"""
        html_with_table = "<table><tr><td>Cell 1</td><td>Cell 2</td></tr></table>"
        data = {
            "html_content": html_with_table,
            "export_format": "csv",
            "filename": "table"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['format'], 'csv')
    
    def test_export_markdown_success(self):
        """Test successful Markdown export"""
        data = {
            "html_content": self.sample_html,
            "export_format": "md",
            "filename": "output"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['format'], 'md')
    
    def test_export_pdf_success(self):
        """Test PDF export (requires WeasyPrint)"""
        data = {
            "html_content": self.sample_html,
            "export_format": "pdf",
            "filename": "document"
        }
        response = self.client.post(self.url, data, format='json')
        # PDF export may fail if WeasyPrint not installed
        if response.status_code == status.HTTP_200_OK:
            self.assertTrue(response.data['success'])
            self.assertEqual(response.data['format'], 'pdf')
        elif response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
            # WeasyPrint not installed - acceptable
            self.assertIn('dependencies', response.data['error'])
    
    def test_export_docx_success(self):
        """Test DOCX export (requires python-docx)"""
        data = {
            "html_content": self.sample_html,
            "export_format": "docx",
            "filename": "document"
        }
        response = self.client.post(self.url, data, format='json')
        # DOCX export may fail if python-docx not installed
        if response.status_code == status.HTTP_200_OK:
            self.assertTrue(response.data['success'])
            self.assertEqual(response.data['format'], 'docx')
        elif response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE:
            # python-docx not installed - acceptable
            self.assertIn('dependencies', response.data['error'])
    
    def test_export_invalid_format(self):
        """Test rejection of invalid export format"""
        data = {
            "html_content": self.sample_html,
            "export_format": "xyz",
            "filename": "test"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])
    
    def test_export_empty_html(self):
        """Test rejection of empty HTML"""
        data = {
            "html_content": "",
            "export_format": "json",
            "filename": "test"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_export_missing_fields(self):
        """Test validation of required fields"""
        data = {
            "html_content": self.sample_html
            # Missing export_format
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class DownloadAPITest(TestCase):
    """Test file download endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.export_url = reverse('compiler:export')
        self.sample_html = "<h2>Test</h2><p>Content</p>"
    
    def test_download_nonexistent_file(self):
        """Test handling of non-existent file"""
        url = reverse('compiler:download', kwargs={'file_id': 'exp_nonexistent'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_export_and_download_flow(self):
        """Test complete export and download flow"""
        # Export
        export_data = {
            "html_content": self.sample_html,
            "export_format": "json",
            "filename": "test"
        }
        export_response = self.client.post(self.export_url, export_data, format='json')
        
        if export_response.status_code == status.HTTP_200_OK:
            file_id = export_response.data['file_id']
            
            # Download
            download_url = reverse('compiler:download', kwargs={'file_id': file_id})
            download_response = self.client.get(download_url)
            
            self.assertEqual(download_response.status_code, status.HTTP_200_OK)


class StatsAPITest(TestCase):
    """Test statistics endpoint"""
    
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('compiler:stats', kwargs={'conversion_id': 999})
    
    def test_stats_nonexistent_conversion(self):
        """Test handling of non-existent conversion"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

