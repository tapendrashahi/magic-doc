#!/usr/bin/env python3
"""Test script for LaTeX converter with complex document"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from converter.converter import convert_latex_to_html

# Test with a sample from the user's document
test_latex = r"""
\section*{1. Complex number :}

Any ordered pair of real numbers ( $\mathrm{a}, \mathrm{b}$ ) is known as a complex number.
It is denoted by $z$ or $w$ and given by $z=(a, b)=a+i b$
$$
\text { where } \begin{aligned}
& a=\operatorname{Re}(z) \\
& b=\operatorname{Im}(z)
\end{aligned}
$$

\section*{Examples :}
$$
\begin{aligned}
& z=(2+3 i) \\
& w=(-1+2 i) \text { etc. }
\end{aligned}
$$

\section*{(2) Addition :}
$\mathrm{z}=(\mathrm{a}, \mathrm{b})$ and $\mathrm{w}=(\mathrm{c}, \mathrm{d})$ be any two complex numbers then
$$
\begin{aligned}
z+w & =(a, b)+(c, d) \\
& =(a+c, b+d)
\end{aligned}
$$

Example:-
$$
\begin{aligned}
\mathrm{z} & =(3,4) \\
\mathrm{w} & =(2,1) \\
\mathrm{z}+\mathrm{w} & =(3+2,4+1) \\
& =(5,5)
\end{aligned}
$$
"""

print("=" * 80)
print("LaTeX Converter Test")
print("=" * 80)
print("\nINPUT LaTeX:\n")
print(test_latex)
print("\n" + "=" * 80)
print("CONVERTED HTML OUTPUT:\n")

html = convert_latex_to_html(test_latex)
print(html)

print("\n" + "=" * 80)
print("✓ Conversion completed successfully!")
print("=" * 80)
