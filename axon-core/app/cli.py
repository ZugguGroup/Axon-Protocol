import argparse
import sys
import uvicorn
import os

def main():
    parser = argparse.ArgumentParser(description="Axon Protocol Server CLI")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    dev_parser = subparsers.add_parser("dev", help="Start Axon server in local mode")
    dev_parser.add_argument("--host", default="127.0.0.1", help="Host to bind (default: 127.0.0.1)")
    dev_parser.add_argument("--port", type=int, default=8000, help="Port to bind (default: 8000)")
    
    args = parser.parse_args()
    
    if args.command == "dev":
        # Force local mode
        os.environ["AXON_MODE"] = "local"
        
        # Ensure directory exists
        axon_dir = os.path.expanduser("~/.axon")
        os.makedirs(axon_dir, exist_ok=True)
        
        # Compile dashboard dynamically if adjacent folder exists
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        workspace_dir = os.path.dirname(parent_dir)
        dashboard_dir = os.path.join(workspace_dir, "axon-dashboard")
        static_dir = os.path.join(parent_dir, "app", "static")
        
        if os.path.exists(dashboard_dir):
            print("Detecting adjacent developer dashboard directory. Compiling latest assets...")
            import subprocess
            import shutil
            try:
                # Compile dashboard via npm run build
                res = subprocess.run("npm run build", shell=True, cwd=dashboard_dir, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if res.returncode == 0:
                    dist_dir = os.path.join(dashboard_dir, "dist")
                    if os.path.exists(dist_dir):
                        if os.path.exists(static_dir):
                            shutil.rmtree(static_dir)
                        shutil.copytree(dist_dir, static_dir)
                        print("Dashboard compiled and synchronized successfully.")
                    else:
                        print("Build completed but 'dist' output directory was not found.")
                else:
                    print(f"Vite compilation skipped (Vite returned code {res.returncode}): {res.stderr.decode('utf-8', errors='ignore')}")
            except Exception as e:
                print(f"Skipping auto-compilation (ensure node/npm are installed): {e}")
        
        print(f"Starting Axon server in local mode on http://{args.host}:{args.port}...")
        uvicorn.run("app.main:app", host=args.host, port=args.port, reload=False)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
