r"""
KaTeX Rendering Module

Renders LaTeX equations to HTML using Node.js KaTeX via subprocess.
Handles both single and batch rendering with comprehensive error handling.

Pipeline Stage 2 of 5: Render LaTeX to KaTeX HTML
"""

import json
import subprocess
import sys
from typing import List, Optional, Dict, Any
from pathlib import Path
from dataclasses import dataclass, field
import logging

from .latex_extractor import Equation, EquationType

logger = logging.getLogger(__name__)


@dataclass
class RenderResult:
    """
    Result of a KaTeX rendering operation
    
    Attributes:
        equation: The original Equation object (modified with katex_html)
        success: Whether rendering was successful
        error: Error message if rendering failed
        html: The rendered KaTeX HTML (on success)
    """
    equation: Equation
    success: bool
    error: Optional[str] = None
    html: Optional[str] = None
    
    def __repr__(self) -> str:
        status = "✓" if self.success else "✗"
        return f"RenderResult[{status}] {self.equation.latex[:50]}"


class KaTeXRenderError(Exception):
    """Exception raised when KaTeX rendering fails"""
    pass


class KaTeXRenderer:
    r"""
    Renders LaTeX equations to KaTeX HTML using Node.js subprocess.
    
    The Node.js render_katex.js script is called as a subprocess for each equation.
    Communication happens via JSON on stdin/stdout.
    
    Usage:
        renderer = KaTeXRenderer()
        result = renderer.render_single(equation)  # Single equation
        results = renderer.render_batch(equations)  # Multiple equations
        
        # After rendering, equations have katex_html attribute set
        for result in results:
            if result.success:
                print(result.equation.katex_html)
    """
    
    # Path to the Node.js KaTeX rendering script
    # Can be overridden by setting environment variable KATEX_SCRIPT_PATH
    SCRIPT_NAME = "render_katex.js"
    SCRIPT_DIR = "assets"
    
    def __init__(self, script_path: Optional[str] = None):
        """
        Initialize the renderer.
        
        Args:
            script_path: Optional path to render_katex.js. If None, will search
                        in backend/assets/ directory.
        """
        if script_path:
            self.script_path = Path(script_path)
        else:
            # Find render_katex.js in backend/assets/
            # Current file is at backend/converter/katex_renderer.py
            # We want backend/assets/render_katex.js
            current_dir = Path(__file__).parent.parent  # backend/
            self.script_path = current_dir / self.SCRIPT_DIR / self.SCRIPT_NAME
        
        # Verify script exists
        if not self.script_path.exists():
            raise KaTeXRenderError(
                f"KaTeX rendering script not found at {self.script_path}\n"
                f"Expected: {self.script_path}"
            )
        
        # Verify Node.js is available
        try:
            subprocess.run(
                ["node", "--version"],
                capture_output=True,
                timeout=5,
                check=True
            )
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            raise KaTeXRenderError(
                f"Node.js not found or not in PATH. "
                f"Required for KaTeX rendering: {e}"
            )
        
        logger.info(f"KaTeXRenderer initialized with script: {self.script_path}")
    
    def render_single(self, equation: Equation, timeout: int = 10) -> RenderResult:
        """
        Render a single equation to KaTeX HTML.
        
        Args:
            equation: The Equation object to render
            timeout: Subprocess timeout in seconds
            
        Returns:
            RenderResult with success status and HTML (if successful)
            
        Note:
            - Modifies equation in-place, setting katex_html attribute
            - Returns RenderResult for error handling and tracking
            - If rendering fails, equation.katex_html is set to empty string
        """
        try:
            # Prepare input JSON
            input_data = {
                "latex": equation.latex,
                "displayMode": equation.is_display_mode
            }
            input_json = json.dumps(input_data)
            
            # Call subprocess
            result = subprocess.run(
                ["node", str(self.script_path)],
                input=input_json,
                capture_output=True,
                timeout=timeout,
                text=True,
                check=False  # Don't raise on non-zero exit
            )
            
            # Check for errors
            if result.returncode != 0:
                error_msg = result.stderr.strip() if result.stderr else "Unknown error"
                equation.katex_html = ""
                return RenderResult(
                    equation=equation,
                    success=False,
                    error=f"Node.js error: {error_msg}"
                )
            
            # Extract HTML from output
            html = result.stdout.strip()
            if not html:
                error_msg = "Empty output from KaTeX renderer"
                equation.katex_html = ""
                return RenderResult(
                    equation=equation,
                    success=False,
                    error=error_msg
                )
            
            # Success - store HTML in equation
            equation.katex_html = html
            return RenderResult(
                equation=equation,
                success=True,
                html=html
            )
            
        except subprocess.TimeoutExpired:
            error_msg = f"Rendering timed out after {timeout}s"
            equation.katex_html = ""
            return RenderResult(
                equation=equation,
                success=False,
                error=error_msg
            )
        
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            equation.katex_html = ""
            return RenderResult(
                equation=equation,
                success=False,
                error=error_msg
            )
    
    def render_batch(
        self,
        equations: List[Equation],
        timeout: int = 10,
        stop_on_error: bool = False
    ) -> List[RenderResult]:
        """
        Render multiple equations to KaTeX HTML.
        
        Args:
            equations: List of Equation objects to render
            timeout: Subprocess timeout per equation in seconds
            stop_on_error: If True, stop rendering on first error
            
        Returns:
            List of RenderResult objects (one per equation)
            
        Note:
            - Processes equations sequentially
            - Each equation is rendered with its own subprocess call
            - Equations are modified in-place with katex_html
            - Returns results for all equations, even on errors (unless stop_on_error=True)
        """
        results = []
        
        for i, equation in enumerate(equations):
            try:
                result = self.render_single(equation, timeout=timeout)
                results.append(result)
                
                # Log progress
                status = "✓" if result.success else f"✗ {result.error}"
                logger.debug(
                    f"[{i+1}/{len(equations)}] Rendered: {equation.latex[:50]}... - {status}"
                )
                
                if not result.success and stop_on_error:
                    logger.warning(f"Stopping batch render on error at equation {i+1}")
                    break
                    
            except Exception as e:
                error_msg = f"Unexpected error in batch rendering: {str(e)}"
                equation.katex_html = ""
                result = RenderResult(
                    equation=equation,
                    success=False,
                    error=error_msg
                )
                results.append(result)
                logger.error(error_msg)
                
                if stop_on_error:
                    break
        
        # Summary logging
        success_count = sum(1 for r in results if r.success)
        total_count = len(results)
        logger.info(
            f"Batch rendering complete: {success_count}/{total_count} successful"
        )
        
        return results
    
    def render_and_update(self, equations: List[Equation]) -> Dict[str, Any]:
        """
        Render equations and return summary statistics.
        
        Args:
            equations: List of equations to render
            
        Returns:
            Dictionary with:
                - 'total': Total equations
                - 'successful': Number successfully rendered
                - 'failed': Number that failed
                - 'results': List of RenderResult objects
                - 'errors': List of error messages from failed renders
        """
        results = self.render_batch(equations)
        
        errors = [r.error for r in results if not r.success]
        
        return {
            'total': len(results),
            'successful': sum(1 for r in results if r.success),
            'failed': sum(1 for r in results if not r.success),
            'results': results,
            'errors': errors
        }


# Utility functions for batch operations

def render_equations_from_extractor(
    extractor_result: tuple
) -> tuple:
    """
    Render equations from LatexExtractor result.
    
    Args:
        extractor_result: Tuple of (equations, sections) from LatexExtractor.extract_all()
        
    Returns:
        Tuple of (equations, sections) with equations having katex_html set
    """
    equations, sections = extractor_result
    
    renderer = KaTeXRenderer()
    renderer.render_batch(equations)
    
    return equations, sections


# Example usage / testing
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(levelname)s: %(message)s'
    )
    
    # Test equations
    test_equations = [
        Equation(
            latex="x^2 + y^2",
            equation_type=EquationType.INLINE,
            start_pos=0,
            end_pos=10,
            original_text="$x^2 + y^2$"
        ),
        Equation(
            latex=r"\frac{a}{b}",
            equation_type=EquationType.INLINE,
            start_pos=20,
            end_pos=32,
            original_text=r"$\frac{a}{b}$"
        ),
        Equation(
            latex=r"(a+x)^{n} = \sum_{r=0}^{n} C(n,r) a^{n-r} x^{r}",
            equation_type=EquationType.DISPLAY,
            start_pos=40,
            end_pos=95,
            original_text=r"$$(a+x)^{n} = \sum_{r=0}^{n} C(n,r) a^{n-r} x^{r}$$"
        ),
    ]
    
    print("=" * 70)
    print("KATEX RENDERING TEST")
    print("=" * 70)
    
    try:
        renderer = KaTeXRenderer()
        print(f"\n✓ Renderer initialized")
        print(f"  Script: {renderer.script_path}")
        
        # Test single rendering
        print(f"\n--- Testing Single Render ---")
        single_result = renderer.render_single(test_equations[0])
        print(f"Result: {single_result}")
        if single_result.success:
            print(f"HTML length: {len(single_result.html)} chars")
            print(f"HTML preview: {single_result.html[:100]}...")
        else:
            print(f"Error: {single_result.error}")
        
        # Test batch rendering
        print(f"\n--- Testing Batch Render ---")
        results = renderer.render_batch(test_equations)
        
        for i, result in enumerate(results):
            mode = "DISPLAY" if result.equation.is_display_mode else "INLINE"
            status = "✓" if result.success else "✗"
            print(f"\n[{i}] {status} {mode}")
            print(f"    LaTeX: {result.equation.latex[:50]}...")
            if result.success:
                print(f"    HTML: {result.html[:80]}...")
            else:
                print(f"    Error: {result.error}")
        
        # Statistics
        success_count = sum(1 for r in results if r.success)
        print(f"\n--- Statistics ---")
        print(f"  Total: {len(results)}")
        print(f"  Successful: {success_count}")
        print(f"  Failed: {len(results) - success_count}")
        
    except KaTeXRenderError as e:
        print(f"\n✗ KaTeX Render Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n" + "=" * 70)
    print("✓ Phase 3: KaTeX Rendering Module Ready")
    print("=" * 70)
