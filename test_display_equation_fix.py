#!/usr/bin/env python3
"""
Test suite for Display Equation Block-Breaking Fix
Validates that display equations properly break text blocks
"""

import sys
sys.path.insert(0, '/home/tapendra/Documents/latex-converter-web')

from backend.converter.html_assembler import HTMLAssembler
from backend.converter.latex_extractor import Equation, EquationType

def test_display_vs_inline():
    """Test that display and inline equations are properly detected"""
    print("\n" + "="*70)
    print("TEST 1: Display vs Inline Detection")
    print("="*70)
    
    inline = Equation(
        latex="x+2",
        equation_type=EquationType.INLINE,
        start_pos=0,
        end_pos=5,
        original_text="$x+2$"
    )
    
    display = Equation(
        latex=r"\frac{a}{b}",
        equation_type=EquationType.DISPLAY,
        start_pos=10,
        end_pos=25,
        original_text=r"$$\frac{a}{b}$$"
    )
    
    assert not inline.is_display_mode, "Inline should have is_display_mode=False"
    assert display.is_display_mode, "Display should have is_display_mode=True"
    
    print("✅ Inline equation detected correctly")
    print("✅ Display equation detected correctly")
    return True

def test_block_separation():
    """Test that display equations create separate blocks"""
    print("\n" + "="*70)
    print("TEST 2: Block Separation with Display Equations")
    print("="*70)
    
    text = "Text before. Equation here. Text after."
    
    display_eq = Equation(
        latex=r"\frac{a}{b}",
        equation_type=EquationType.DISPLAY,
        start_pos=13,
        end_pos=20,
        original_text=r"$$\frac{a}{b}$$"
    )
    
    assembler = HTMLAssembler()
    html = assembler.assemble_fragment(text, [display_eq], [])
    
    # Check that we have multiple <p> blocks
    p_count = html.count('<p>')
    assert p_count >= 2, f"Expected at least 2 <p> blocks, got {p_count}"
    
    # Check that display equation has its own block
    assert '<p><span class="tiptap-katex"' in html, "Display equation should have own <p> block"
    
    print(f"✅ Generated {p_count} <p> blocks as expected")
    print(f"✅ Display equation has separate <p> block")
    print(f"\nGenerated HTML:\n{html}")
    return True

def test_inline_stays_with_text():
    """Test that inline equations stay in same block as text"""
    print("\n" + "="*70)
    print("TEST 3: Inline Equations Stay in Same Block")
    print("="*70)
    
    text = "The value of $x$ is important."
    
    inline_eq = Equation(
        latex="x",
        equation_type=EquationType.INLINE,
        start_pos=14,
        end_pos=17,
        original_text="$x$"
    )
    
    assembler = HTMLAssembler()
    html = assembler.assemble_fragment(text, [inline_eq], [])
    
    # Should have exactly 1 <p> block
    p_count = html.count('<p>')
    assert p_count == 1, f"Expected 1 <p> block for inline, got {p_count}"
    
    # Check that text and equation are in same block
    assert 'The value of' in html and 'tiptap-katex' in html, "Text and equation should be in same block"
    
    print(f"✅ Inline equation stays in single <p> block")
    print(f"\nGenerated HTML:\n{html}")
    return True

def test_latex_artifact_removal():
    """Test that LaTeX artifacts are removed from text"""
    print("\n" + "="*70)
    print("TEST 4: LaTeX Artifact Removal")
    print("="*70)
    
    assembler = HTMLAssembler()
    
    test_cases = [
        (r"\mathrm{a}", "a"),
        (r"\textbf{bold}", "bold"),
        (r"\It is denoted", "is denoted"),
        (r"\\It is denoted", "is denoted"),
        (r"\includegraphics[...]{image.pdf}", ""),
        (r"\setcounter{enumi}{2}", ""),
    ]
    
    for input_text, expected_contains in test_cases:
        cleaned = assembler._clean_latex_text(input_text)
        assert '\\' not in cleaned, f"Backslash still in cleaned text: {cleaned}"
        if expected_contains:
            assert expected_contains in cleaned, f"Expected '{expected_contains}' in '{cleaned}'"
        print(f"✅ '{input_text[:30]}...' → No backslashes")
    
    print("\n✅ All LaTeX artifacts successfully removed!")
    return True

def test_mixed_equations():
    """Test with both inline and display equations"""
    print("\n" + "="*70)
    print("TEST 5: Mixed Inline and Display Equations")
    print("="*70)
    
    text = "The value $x$ is used. Then $$y=mx+b$$. Finally, $z$ is calculated."
    
    equations = [
        Equation(
            latex="x",
            equation_type=EquationType.INLINE,
            start_pos=11,
            end_pos=14,
            original_text="$x$"
        ),
        Equation(
            latex="y=mx+b",
            equation_type=EquationType.DISPLAY,
            start_pos=30,
            end_pos=41,
            original_text=r"$$y=mx+b$$"
        ),
        Equation(
            latex="z",
            equation_type=EquationType.INLINE,
            start_pos=58,
            end_pos=61,
            original_text="$z$"
        ),
    ]
    
    assembler = HTMLAssembler()
    html = assembler.assemble_fragment(text, equations, [])
    
    # Should have 3+ <p> blocks (before/display/after, or more if text breaks)
    p_count = html.count('<p>')
    assert p_count >= 3, f"Expected at least 3 <p> blocks, got {p_count}"
    
    print(f"✅ Generated {p_count} <p> blocks for mixed equations")
    print(f"\nGenerated HTML (formatted):")
    print(html.replace('><', '>\n<'))
    return True

def test_equation_format():
    """Test that equations use plain LaTeX, not URL-encoded"""
    print("\n" + "="*70)
    print("TEST 6: Equation Format (Plain LaTeX, Not URL-Encoded)")
    print("="*70)
    
    eq = Equation(
        latex=r"\mathrm{a}, \mathrm{b}",
        equation_type=EquationType.INLINE,
        start_pos=0,
        end_pos=25,
        original_text=r"$\mathrm{a}, \mathrm{b}$"
    )
    
    assembler = HTMLAssembler()
    wrapped = assembler.wrap_equation_tiptap(eq)
    
    # Should NOT have URL encoding
    assert '%' not in wrapped, f"URL encoding found in: {wrapped}"
    
    # Should have plain LaTeX
    assert r'\mathrm{a}' in wrapped, f"LaTeX not found in: {wrapped}"
    
    # Should match Tiptap format
    assert 'data-latex="' in wrapped, f"Tiptap format not found in: {wrapped}"
    assert 'tiptap-katex' in wrapped, f"Class not found in: {wrapped}"
    
    print(f"✅ Plain LaTeX format (no URL encoding)")
    print(f"✅ Structure: {wrapped[:80]}...")
    return True
    
    tests = [
        ("Display vs Inline Detection", test_display_vs_inline),
        ("Block Separation", test_block_separation),
        ("Inline Stays with Text", test_inline_stays_with_text),
        ("LaTeX Artifact Removal", test_latex_artifact_removal),
        ("Mixed Equations", test_mixed_equations),
        ("Equation Format", test_equation_format),
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except AssertionError as e:
            print(f"\n❌ FAILED: {e}")
            failed += 1
        except Exception as e:
            print(f"\n❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            failed += 1
    
    print("\n" + "="*70)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("="*70)
    
    if failed == 0:
        print("\n✅ ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print(f"\n❌ {failed} TEST(S) FAILED")
        sys.exit(1)
