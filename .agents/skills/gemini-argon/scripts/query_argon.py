#!/usr/bin/env python3
"""
query_argon.py: Directly queries Gemini 4 Argon on Vertex AI.
Uses Application Default Credentials (ADC) or `gcloud auth print-access-token`.
"""

import sys
import os
import json
import argparse
import subprocess
import urllib.request
import urllib.error

def get_auth_token():
    # 1. Try gcloud CLI
    try:
        out = subprocess.check_output(["gcloud", "auth", "print-access-token"], stderr=subprocess.DEVNULL)
        token = out.decode("utf-8").strip()
        if token:
            return token
    except Exception:
        pass

    # 2. Try ADC file
    adc_path = os.path.expanduser("~/.config/gcloud/application_default_credentials.json")
    if os.path.exists(adc_path):
        try:
            with open(adc_path) as f:
                creds = json.load(f)
            # If refresh_token is present, refresh it
            client_id = creds.get("client_id")
            client_secret = creds.get("client_secret")
            refresh_token = creds.get("refresh_token")
            if client_id and client_secret and refresh_token:
                data = urllib.parse.urlencode({
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "refresh_token": refresh_token,
                    "grant_type": "refresh_token"
                }).encode("utf-8")
                req = urllib.request.Request("https://oauth2.googleapis.com/token", data=data)
                with urllib.request.urlopen(req) as resp:
                    res = json.loads(resp.read().decode())
                    return res.get("access_token")
        except Exception:
            pass

    raise RuntimeError("Unable to obtain Google Cloud access token. Please run 'gcloud auth application-default login'.")

def query_gemini_argon(prompt: str, project: str = "ai-agy-512808", location: str = "global", model_id: str = "gemini-4-argon", system_instruction: str = None, context_files: list = None):
    token = get_auth_token()
    
    # Endpoint for global or regional Vertex AI
    if location == "global":
        host = "aiplatform.googleapis.com"
    else:
        host = f"{location}-aiplatform.googleapis.com"

    url = f"https://{host}/v1/projects/{project}/locations/{location}/publishers/google/models/{model_id}:generateContent"

    parts = []
    
    # Append context files if specified
    if context_files:
        for file_path in context_files:
            abs_path = os.path.abspath(file_path)
            if os.path.exists(abs_path):
                try:
                    with open(abs_path, "r", encoding="utf-8", errors="replace") as f:
                        file_content = f.read()
                    parts.append({"text": f"--- Context File: {abs_path} ---\n{file_content}\n--- End Context File ---\n"})
                except Exception as e:
                    print(f"Warning: could not read context file {abs_path}: {e}", file=sys.stderr)

    parts.append({"text": prompt})

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": parts
            }
        ]
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}]
        }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            candidates = body.get("candidates", [])
            if candidates:
                cand = candidates[0]
                content = cand.get("content", {})
                parts = content.get("parts", [])
                text_pieces = [p.get("text", "") for p in parts if "text" in p]
                return "".join(text_pieces)
            else:
                return json.dumps(body, indent=2)
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8", errors="replace")
        if e.code == 429:
            raise RuntimeError(f"Rate limit exceeded (HTTP 429 Resource Exhausted). Please wait 30-60 seconds for the quota window to reset.\nDetails: {err_msg}")
        raise RuntimeError(f"Vertex AI API error (HTTP {e.code}):\n{err_msg}")
    except Exception as e:
        raise RuntimeError(f"Failed to communicate with Vertex AI: {e}")

def main():
    parser = argparse.ArgumentParser(description="Query Gemini 4 Argon via Vertex AI directly.")
    parser.add_argument("--prompt", "-p", type=str, help="The prompt to send to Gemini 4 Argon")
    parser.add_argument("--file", "-f", type=str, help="Read prompt from a file")
    parser.add_argument("--context", "-c", action="append", help="Attach a file as context (repeatable)")
    parser.add_argument("--system", "-s", type=str, help="Optional system instruction")
    parser.add_argument("--project", default=os.environ.get("GOOGLE_CLOUD_PROJECT", "ai-agy-512808"), help="GCP project ID")
    parser.add_argument("--location", default="global", help="Vertex AI location (default: global)")
    parser.add_argument("--model", default="gemini-4-argon", help="Model ID (default: gemini-4-argon)")

    args = parser.parse_args()

    prompt_text = ""
    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            prompt_text = f.read()
    elif args.prompt:
        prompt_text = args.prompt
    elif not sys.stdin.isatty():
        prompt_text = sys.stdin.read()
    else:
        parser.print_help()
        sys.exit(1)

    if not prompt_text.strip():
        print("Error: Empty prompt.", file=sys.stderr)
        sys.exit(1)

    try:
        result = query_gemini_argon(
            prompt=prompt_text,
            project=args.project,
            location=args.location,
            model_id=args.model,
            system_instruction=args.system,
            context_files=args.context
        )
        print(result)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
