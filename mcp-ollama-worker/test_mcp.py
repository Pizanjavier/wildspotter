import os
from mcp_server import delegate_to_gemma

# Read context files
marketing_path = "/Users/javier/Documents/Proyects/wildspotter/marketing-path"
with open(os.path.join(marketing_path, "CLAUDE.md"), "r") as f:
    claude_md = f.read()

with open(os.path.join(marketing_path, ".claude/skills/remotion-best-practices/SKILL.md"), "r") as f:
    remotion_skill = f.read()

context = f"CONTEXT 1: CLAUDE.md\n{claude_md}\n\nCONTEXT 2: Remotion Best Practices\n{remotion_skill}"

prompt = """
Write the React Remotion component code (TSX) for an Instagram Story (1080x1920) intended for Sunday, May 10th.
Task based on active campaigns: "Anticipation / Countdown Story".
- Topic: "Mañana revelamos un spot para cuando te quedas sin sitio de noche... Score por encima de 80."
- Visuals: Blurry/pixelated map background. Use the WildSpotter earthy color palette (#D97706, #1E1A17, etc.) and Inter/JetBrains Mono fonts.
- Include an animated countdown text or placeholder.
- Strictly follow the Remotion best practices provided in the context (useCurrentFrame, interpolate, AbsoluteFill, Tailwind v4).

Output ONLY the complete TSX code for this Remotion scene, ready to be dropped into the project. No markdown explanations outside the code block.
"""

print("Testing delegation to local Qwen 3.6 (27B) with context...")
response = delegate_to_gemma(prompt, context=context)
print("\nResponse from Qwen 3.6:")
print("-" * 40)
print(response)
print("-" * 40)

