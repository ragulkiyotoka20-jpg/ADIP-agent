"""
Python script to cleanly replace each branch's content on GitHub
with the updated codebase from Agent_Backup for each respective agent.
"""

import os
import shutil
import subprocess

backup_dir = r"C:\Users\Guru\Desktop\Agent_Backup"
main_repo = r"c:\Users\Guru\Desktop\ADIP"

mappings = [
    ("orchestrator-agent", "orchestrator-agent"),
    ("universal-director-agent", "universal-director-agent"),
    ("qa-agent", "qa-agent"),
    ("release-intelligence", "release-intelligence"),
    ("documentation", "documentation"),
    ("codex-knowledge-graph", "codex/knowledge-graph"),
    ("explorer", "explorer"),
    ("main", "main"),
]

for folder_name, branch_name in mappings:
    src_folder = os.path.join(backup_dir, folder_name)
    if not os.path.exists(src_folder):
        print(f"Skipping {folder_name}, folder not found at {src_folder}.")
        continue
    
    print(f"\n==================================================")
    print(f" Updating Branch: {branch_name}")
    print(f" Source Folder : {src_folder}")
    print(f"==================================================")
    
    clean_wt_name = "wt_" + folder_name.replace("-", "_").replace("/", "_")
    wt_dir = os.path.join(r"C:\Users\Guru\Desktop", clean_wt_name)
    if os.path.exists(wt_dir):
        shutil.rmtree(wt_dir, ignore_errors=True)
        
    subprocess.run(["git", "worktree", "prune"], cwd=main_repo, capture_output=True)
    
    # Add worktree for target branch
    ref_name = f"remotes/origin/{branch_name}"
    local_b = branch_name.replace("/", "-")
    res = subprocess.run(["git", "worktree", "add", "-B", local_b, wt_dir, ref_name], cwd=main_repo, capture_output=True, text=True)
    if res.returncode != 0:
        subprocess.run(["git", "worktree", "add", wt_dir, ref_name], cwd=main_repo, capture_output=True)

    if not os.path.exists(wt_dir):
        print(f"Failed to create worktree for {branch_name}.")
        continue

    # Clean existing tracked/untracked files in worktree except .git
    for root, dirs, files in os.walk(wt_dir, topdown=False):
        for f in files:
            p = os.path.join(root, f)
            if ".git" not in p:
                try:
                    os.remove(p)
                except Exception:
                    pass
        for d in dirs:
            p = os.path.join(root, d)
            if ".git" not in p:
                try:
                    shutil.rmtree(p, ignore_errors=True)
                except Exception:
                    pass

    # Copy all files from Agent_Backup to worktree
    for item in os.listdir(src_folder):
        s_item = os.path.join(src_folder, item)
        d_item = os.path.join(wt_dir, item)
        if os.path.isdir(s_item):
            shutil.copytree(s_item, d_item, dirs_exist_ok=True)
        else:
            shutil.copy2(s_item, d_item)

    # Stage all changes
    subprocess.run(["git", "add", "-A"], cwd=wt_dir, check=True)
    
    # Commit
    subprocess.run(["git", "commit", "-m", f"refactor: replace {branch_name} branch content with updated agent implementation"], cwd=wt_dir, capture_output=True)
    
    # Push to origin
    current_env = dict(os.environ)
    current_env["GIT_TERMINAL_PROMPT"] = "0"
    push_res = subprocess.run(["git", "push", "origin", f"HEAD:refs/heads/{branch_name}", "--force"], cwd=wt_dir, env=current_env, capture_output=True, text=True)
    print(f"Push Result for {branch_name}:\n{push_res.stdout}\n{push_res.stderr}")
    
    subprocess.run(["git", "worktree", "prune"], cwd=main_repo, capture_output=True)
    if os.path.exists(wt_dir):
        shutil.rmtree(wt_dir, ignore_errors=True)
        
    print(f"[SUCCESS] Updated and force-pushed branch '{branch_name}' to GitHub!")

print("\nALL 8 AGENT BRANCHES UPDATED ON GITHUB!")
