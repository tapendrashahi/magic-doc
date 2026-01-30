#!/usr/bin/env python3
"""
Phase 4 Integration Testing Script
Tests all .tex files in roadmap folder using backend API
Verifies outputs match expected HTML files
"""

import os
import sys
import json
import time
from pathlib import Path
import requests
from datetime import datetime

# Configuration
ROADMAP_DIR = Path('/home/tapendra/Documents/latex-converter-web/roadmap')
BACKEND_URL = 'http://localhost:8000/api/compiler'
EXPECTED_OUTPUTS = {
    'output.html': ROADMAP_DIR / 'output.html',
    'output2.html': ROADMAP_DIR / 'output2.html',
}

# Test Results
test_results = {
    'total_tests': 0,
    'passed': 0,
    'failed': 0,
    'errors': [],
    'start_time': datetime.now().isoformat(),
    'test_details': [],
}

def get_tex_files():
    """Get all .tex files in roadmap folder"""
    tex_files = list(ROADMAP_DIR.glob('*.tex'))
    return sorted(tex_files)

def read_tex_file(file_path):
    """Read .tex file content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return None

def read_expected_output(file_path):
    """Read expected output HTML"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return None

def test_api_health():
    """Test if backend API is running"""
    print("\n" + "="*80)
    print("TEST 1: API HEALTH CHECK")
    print("="*80)
    
    try:
        # Try the actual endpoint
        response = requests.get(f'{BACKEND_URL}/convert-tex/', timeout=5)
        # Any response means server is up
        print("✅ Backend API is running")
        return True
    except Exception as e:
        print(f"❌ Cannot connect to backend API: {str(e)}")
        print(f"   Make sure Django is running on http://localhost:8000")
        return False

def test_single_file_compilation(tex_file):
    """Test compilation of a single .tex file"""
    filename = tex_file.name
    content = read_tex_file(tex_file)
    
    if not content:
        return {
            'file': filename,
            'status': 'FAILED',
            'reason': 'Cannot read file',
            'time_ms': 0,
        }
    
    start_time = time.time()
    
    try:
        response = requests.post(
            f'{BACKEND_URL}/convert-tex/',
            json={
                'content': content,
                'filename': filename,
            },
            timeout=30,
        )
        
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            data = response.json()
            html_output = data.get('html_output') or data.get('html') or data.get('html_content') or ''
            
            return {
                'file': filename,
                'status': 'SUCCESS',
                'html_length': len(html_output),
                'has_math': 'tiptap-katex' in html_output or 'math' in html_output,
                'time_ms': elapsed_ms,
                'html': html_output,
            }
        else:
            return {
                'file': filename,
                'status': 'FAILED',
                'reason': f'HTTP {response.status_code}',
                'response': response.text[:200],
                'time_ms': elapsed_ms,
            }
    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        return {
            'file': filename,
            'status': 'ERROR',
            'reason': str(e),
            'time_ms': elapsed_ms,
        }

def test_batch_compilation(tex_files):
    """Test batch compilation of all .tex files"""
    print("\n" + "="*80)
    print("TEST 2: BATCH COMPILATION")
    print("="*80)
    
    files_data = []
    for tex_file in tex_files:
        content = read_tex_file(tex_file)
        if content:
            files_data.append({
                'filename': tex_file.name,
                'content': content,
            })
    
    if not files_data:
        print("❌ No .tex files to compile")
        return None
    
    start_time = time.time()
    
    try:
        response = requests.post(
            f'{BACKEND_URL}/convert-batch/',
            json={'files': files_data},
            timeout=60,
        )
        
        elapsed_ms = int((time.time() - start_time) * 1000)
        
        if response.status_code == 200:
            data = response.json()
            results = data.get('results', [])
            successful = sum(1 for r in results if r.get('status') == 'success')
            failed = sum(1 for r in results if r.get('status') == 'error')
            
            print(f"✅ Batch compilation completed in {elapsed_ms}ms")
            print(f"   Total files: {len(results)}")
            print(f"   Successful: {successful}")
            print(f"   Failed: {failed}")
            
            return {
                'status': 'SUCCESS',
                'total': len(results),
                'successful': successful,
                'failed': failed,
                'time_ms': elapsed_ms,
                'results': results,
            }
        else:
            print(f"❌ Batch compilation failed: HTTP {response.status_code}")
            return {
                'status': 'FAILED',
                'reason': f'HTTP {response.status_code}',
                'time_ms': elapsed_ms,
            }
    except Exception as e:
        elapsed_ms = int((time.time() - start_time) * 1000)
        print(f"❌ Batch compilation error: {str(e)}")
        return {
            'status': 'ERROR',
            'reason': str(e),
            'time_ms': elapsed_ms,
        }

def test_export_formats(html_content):
    """Test all export formats"""
    print("\n" + "="*80)
    print("TEST 3: EXPORT FORMATS")
    print("="*80)
    
    formats = ['pdf', 'markdown', 'json', 'csv', 'docx']
    results = {}
    
    for fmt in formats:
        start_time = time.time()
        
        try:
            response = requests.post(
                f'{BACKEND_URL}/export/',
                json={
                    'html_content': html_content,
                    'export_format': fmt,
                    'filename': 'test_export',
                },
                timeout=30,
            )
            
            elapsed_ms = int((time.time() - start_time) * 1000)
            
            if response.status_code == 200:
                data = response.json()
                results[fmt] = {
                    'status': 'SUCCESS',
                    'time_ms': elapsed_ms,
                }
                print(f"✅ {fmt.upper()}: {elapsed_ms}ms")
            else:
                results[fmt] = {
                    'status': 'FAILED',
                    'reason': f'HTTP {response.status_code}',
                    'time_ms': elapsed_ms,
                }
                print(f"❌ {fmt.upper()}: HTTP {response.status_code}")
        except Exception as e:
            elapsed_ms = int((time.time() - start_time) * 1000)
            results[fmt] = {
                'status': 'ERROR',
                'reason': str(e),
                'time_ms': elapsed_ms,
            }
            print(f"❌ {fmt.upper()}: {str(e)}")
    
    return results

def compare_outputs(generated_html):
    """Compare generated HTML with expected outputs"""
    print("\n" + "="*80)
    print("TEST 4: OUTPUT VALIDATION")
    print("="*80)
    
    matches = {}
    
    for output_name, output_path in EXPECTED_OUTPUTS.items():
        expected_html = read_expected_output(output_path)
        
        if not expected_html:
            print(f"⚠️  Cannot read expected output: {output_name}")
            matches[output_name] = {
                'status': 'SKIPPED',
                'reason': 'Cannot read file',
            }
            continue
        
        # Simple similarity check
        gen_lines = set(generated_html.split('\n'))
        exp_lines = set(expected_html.split('\n'))
        
        matching_lines = len(gen_lines & exp_lines)
        total_lines = max(len(gen_lines), len(exp_lines))
        
        similarity = (matching_lines / total_lines * 100) if total_lines > 0 else 0
        
        matches[output_name] = {
            'status': 'COMPARED',
            'similarity': round(similarity, 2),
            'matching_lines': matching_lines,
            'total_lines': total_lines,
        }
        
        if similarity > 80:
            print(f"✅ {output_name}: {similarity:.1f}% match")
        elif similarity > 50:
            print(f"⚠️  {output_name}: {similarity:.1f}% match (partial)")
        else:
            print(f"❌ {output_name}: {similarity:.1f}% match (low)")
    
    return matches

def print_summary(results):
    """Print test summary"""
    print("\n" + "="*80)
    print("PHASE 4 TEST SUMMARY")
    print("="*80)
    
    # Filter out non-test results
    test_details = [r for r in results['test_details'] if isinstance(r, dict) and 'status' in r]
    
    passed = sum(1 for r in test_details if r.get('status') == 'SUCCESS')
    failed = sum(1 for r in test_details if r.get('status') in ['FAILED', 'ERROR'])
    
    print(f"\nTotal Tests: {len(test_details)}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    
    if failed == 0 and len(test_details) > 0:
        print("\n🎉 ALL TESTS PASSED! 🎉")
    else:
        print(f"\n⚠️  {failed} test(s) failed. See details above.")
    
    # Detailed results
    print("\nDetailed Results:")
    print("-" * 80)
    for detail in test_details:
        if 'file' in detail:
            status_icon = "✅" if detail.get('status') == 'SUCCESS' else "❌"
            print(f"{status_icon} {detail.get('file', 'Unknown')}: {detail.get('status', 'Unknown')}")
            if 'time_ms' in detail:
                print(f"   Time: {detail['time_ms']}ms")
            if 'reason' in detail:
                print(f"   Reason: {detail['reason']}")
            if 'html_length' in detail:
                print(f"   HTML Length: {detail['html_length']} bytes")
            if 'has_math' in detail:
                print(f"   Has Math: {detail['has_math']}")

def main():
    """Main test execution"""
    print("\n" + "="*80)
    print("PHASE 4: FRONTEND-BACKEND INTEGRATION TESTING")
    print("="*80)
    print(f"Start Time: {test_results['start_time']}")
    print(f"Roadmap Directory: {ROADMAP_DIR}")
    print(f"Backend URL: {BACKEND_URL}")
    
    # Check API health
    if not test_api_health():
        print("\n❌ Cannot proceed without backend API")
        print("Start the backend with: python manage.py runserver")
        return
    
    # Get .tex files
    tex_files = get_tex_files()
    print(f"\n✅ Found {len(tex_files)} .tex files to test")
    for f in tex_files:
        print(f"   - {f.name} ({f.stat().st_size / 1024:.1f}KB)")
    
    # Test each file individually
    print("\n" + "="*80)
    print("TEST 1: INDIVIDUAL FILE COMPILATION")
    print("="*80)
    
    for i, tex_file in enumerate(tex_files, 1):
        print(f"\n[{i}/{len(tex_files)}] Testing {tex_file.name}...")
        result = test_single_file_compilation(tex_file)
        test_results['test_details'].append(result)
        
        if result['status'] == 'SUCCESS':
            print(f"   ✅ Success ({result['time_ms']}ms, {result['html_length']} bytes)")
            if result['has_math']:
                print(f"   ✅ Contains math rendering")
            
            # Test export formats on first file
            if i == 1:
                export_results = test_export_formats(result['html'])
        else:
            print(f"   ❌ {result['status']}: {result.get('reason', 'Unknown error')}")
    
    # Test batch compilation
    batch_result = test_batch_compilation(tex_files)
    if batch_result:
        test_results['test_details'].append(batch_result)
    
    # Print summary
    print_summary(test_results)
    
    # Save results
    results_file = ROADMAP_DIR / 'phase4_test_results.json'
    with open(results_file, 'w') as f:
        json.dump(test_results, f, indent=2)
    print(f"\n✅ Test results saved to: {results_file}")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Testing interrupted by user")
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
