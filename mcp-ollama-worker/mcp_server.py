from mcp.server.fastmcp import FastMCP
import requests

# Create the MCP server
mcp = FastMCP("Local-Ollama-Worker")


@mcp.tool()
def delegate_to_gemma(prompt: str, context: str = "") -> str:
    """
    Delegate a repetitive or simple text generation task to the local Gemma 4 model.
    Use this to save cloud tokens when summarizing, formatting, or extracting data.
    """
    full_prompt = f"{context}\n\nTask: {prompt}" if context else prompt

    try:
        # Call the local Ollama instance
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "qwen3.6:27b",
                "prompt": full_prompt,
                "stream": False,
            },
        )
        response.raise_for_status()
        return response.json().get("response", "No response generated.")
    except Exception as e:
        return f"Error contacting local Ollama: {str(e)}"


if __name__ == "__main__":
    mcp.run()
