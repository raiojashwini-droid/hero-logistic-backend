import os
import re

def resolve_git_conflicts(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match git conflict markers
    # We want to keep the HEAD part and discard the rest.
    pattern = re.compile(
        r'<<<<<<< HEAD\n(.*?)\n=======\n.*?\n>>>>>>> [^\n]*\n',
        re.DOTALL
    )

    new_content, count = pattern.subn(r'\1\n', content)

    # Sometimes the ========= part might be missing or different, but standard git conflict is exactly like that.
    # What if there are malformed markers like <<<<<<< HEAD with no =======?
    # Let's just first try the standard pattern.

    if count > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {count} conflicts in {filepath}")
    else:
        # Check for malformed markers
        if '<<<<<<<' in content:
            print(f"Warning: {filepath} has malformed conflict markers!")
            # try to remove lone markers
            new_content = re.sub(r'<<<<<<< HEAD\n', '', content)
            new_content = re.sub(r'=======\n', '', new_content)
            new_content = re.sub(r'>>>>>>> [^\n]*\n', '', new_content)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Removed malformed markers in {filepath}")

def main():
    src_dir = r"d:\kiaan\Hero_Logistic\Hero-Logistic-Clone\backend\src"
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx')):
                filepath = os.path.join(root, file)
                resolve_git_conflicts(filepath)

if __name__ == "__main__":
    main()
